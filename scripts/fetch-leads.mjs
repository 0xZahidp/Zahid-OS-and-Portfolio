#!/usr/bin/env node

/**
 * Free Automated Ingestion Worker: Startup Leads & Outreach Radar
 * FolioFrame Studio (zahidp.com)
 *
 * Runs every 4 hours via GitHub Actions or locally via `node scripts/fetch-leads.mjs`.
 * 100% Free APIs:
 * - Reddit JSON / RSS (filtered for "hiring" posts < 24h)
 * - Hacker News Algolia API (story search + monthly Ask HN Who is hiring comments)
 * - Free Startup & Web3 Seed Funding RSS feeds (CoinDesk, The Block, TechCrunch, Decrypt)
 * - Google Gemini Free Tier API (Structured JSON triage, qualification & pitch hook)
 * - Optional Hunter.io API (rate-limited to 2 calls per run for free tier preservation)
 * - Supabase Service Role upsert with strict deduplication against existing leads and Career Pipeline
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

// -----------------------------------------------------------------------------
// 1. Environment Loading (Local dev fallback)
// -----------------------------------------------------------------------------
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const MAX_HUNTER_CALLS_PER_RUN = parseInt(process.env.MAX_HUNTER_CALLS_PER_RUN || '2', 10);

const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

const USER_AGENT = 'FolioFrameRadar/1.0 (+https://zahidp.com)';

function normalizeCompany(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function parseXmlFeed(xml) {
  const items = [];
  const itemRegex = /<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const raw = match[0];
    const getTag = (tag) => {
      const r = new RegExp(`<(?:[\\w-]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`, 'i');
      const m = raw.match(r);
      if (!m) return '';
      return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
    };
    const linkMatch =
      raw.match(/<link[^>]*href=["']([^"']+)["']/i) ||
      raw.match(/<link>([\s\S]*?)<\/link>/i);
    const link = linkMatch ? linkMatch[1].trim() : '';
    const title = getTag('title').replace(/<[^>]+>/g, '').trim();
    const description = (
      getTag('description') ||
      getTag('summary') ||
      getTag('content:encoded') ||
      getTag('content')
    )
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const pubDate = getTag('pubDate') || getTag('published') || getTag('updated');
    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  }
  return items;
}

// -----------------------------------------------------------------------------
// 2. Fetch Free Sources
// -----------------------------------------------------------------------------

// 2a. Fetch Reddit posts (JSON or RSS with fallback)
async function fetchRedditSubreddit(sub) {
  const posts = [];
  const oneDayAgoSec = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

  // Try Reddit JSON with proper headers
  try {
    const url = `https://www.reddit.com/r/${sub}/new.json?limit=25`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const children = data?.data?.children || [];
      for (const item of children) {
        const post = item.data;
        if (!post) continue;
        if (post.created_utc && post.created_utc < oneDayAgoSec) continue;

        const title = post.title || '';
        const lowerTitle = title.toLowerCase();

        // Must be hiring or relevant
        const isHiring =
          lowerTitle.includes('[hiring]') ||
          lowerTitle.includes('hiring') ||
          lowerTitle.includes('looking for') ||
          lowerTitle.includes('we are hiring');
        const isSeekingWork =
          lowerTitle.includes('[for hire]') ||
          lowerTitle.includes('for hire') ||
          lowerTitle.includes('seeking work');

        if (isHiring && !isSeekingWork) {
          posts.push({
            id: `reddit_${post.id}`,
            source: 'reddit',
            title,
            text: (post.selftext || '').slice(0, 1000),
            url: `https://reddit.com${post.permalink}`,
            created_at: new Date(post.created_utc * 1000).toISOString(),
          });
        }
      }
      return posts;
    }
  } catch {
    // If JSON fails, proceed to RSS fallback
  }

  // Fallback: Reddit RSS feed
  try {
    const rssUrl = `https://www.reddit.com/r/${sub}/new/.rss`;
    const rssRes = await fetch(rssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });
    if (rssRes.ok) {
      const xml = await rssRes.text();
      const items = parseXmlFeed(xml);
      for (const item of items) {
        const lowerTitle = item.title.toLowerCase();
        const isHiring = lowerTitle.includes('hiring') || lowerTitle.includes('looking for');
        const isSeekingWork = lowerTitle.includes('for hire');
        if (isHiring && !isSeekingWork) {
          posts.push({
            id: `reddit_rss_${Buffer.from(item.link).toString('base64').slice(0, 16)}`,
            source: 'reddit',
            title: item.title,
            text: item.description.slice(0, 1000),
            url: item.link,
            created_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn(`[Reddit] Could not fetch r/${sub}:`, err.message);
  }

  return posts;
}

// 2b. Fetch Hacker News (Algolia API)
async function fetchHackerNews() {
  const posts = [];

  // 1. Stories with query=hiring
  try {
    const storyUrl =
      'https://hn.algolia.com/api/v1/search_by_date?tags=story&query=hiring&hitsPerPage=20';
    const res = await fetch(storyUrl);
    if (res.ok) {
      const data = await res.json();
      for (const hit of data.hits || []) {
        posts.push({
          id: `hn_story_${hit.objectID}`,
          source: 'hn',
          title: hit.title || '',
          text: (hit.story_text || hit.comment_text || '').slice(0, 1000),
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          created_at: hit.created_at || new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('[HN] Story search failed:', err.message);
  }

  // 2. Monthly "Ask HN: Who is hiring?" latest comments
  try {
    const threadRes = await fetch(
      'https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring&hitsPerPage=1'
    );
    if (threadRes.ok) {
      const threadData = await threadRes.json();
      const latestStory = threadData?.hits?.[0];
      if (latestStory?.objectID) {
        const commentsRes = await fetch(
          `https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${latestStory.objectID}&hitsPerPage=30`
        );
        if (commentsRes.ok) {
          const comData = await commentsRes.json();
          for (const com of comData.hits || []) {
            const rawHtml = com.comment_text || '';
            const plain = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (plain.length > 50) {
              const firstLine = plain.split('\n')[0].slice(0, 100);
              posts.push({
                id: `hn_com_${com.objectID}`,
                source: 'hn_whoishiring',
                title: firstLine,
                text: plain.slice(0, 1200),
                url: `https://news.ycombinator.com/item?id=${com.objectID}`,
                created_at: com.created_at || new Date().toISOString(),
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[HN] Whoishiring comments failed:', err.message);
  }

  return posts;
}

// 2c. Fetch Startup & Web3 Seed Funding RSS Feeds
async function fetchSeedFundingFeeds() {
  const feeds = [
    { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'The Block', url: 'https://www.theblock.co/rss.xml' },
    { name: 'TechCrunch Startups', url: 'https://techcrunch.com/category/startups/feed/' },
    { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  ];

  const fundingKeywords = [
    'seed',
    'pre-seed',
    'raises',
    'raised',
    'series a',
    'funding',
    'secures',
    'backed by',
    'valuation',
  ];

  const posts = [];

  for (const feed of feeds) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (res.ok) {
        const xml = await res.text();
        const items = parseXmlFeed(xml);
        for (const item of items) {
          const lower = (item.title + ' ' + item.description).toLowerCase();
          const hasKeyword = fundingKeywords.some((kw) => lower.includes(kw));
          if (hasKeyword) {
            posts.push({
              id: `rss_${feed.name.replace(/\s+/g, '')}_${Buffer.from(item.link).toString('base64').slice(0, 16)}`,
              source: feed.name,
              title: item.title,
              text: item.description.slice(0, 1000),
              url: item.link,
              created_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.warn(`[RSS] Failed to fetch ${feed.name}:`, err.message);
    }
  }

  return posts;
}

// -----------------------------------------------------------------------------
// 3. AI Triage via Google Gemini (Free Tier)
// -----------------------------------------------------------------------------
async function triageWithGemini(apiKey, batch) {
  if (!apiKey) {
    console.log('[Gemini] No GEMINI_API_KEY found, skipping AI qualification.');
    return [];
  }

  const prompt = `You are an expert AI talent & startup intelligence scout working for Zahid Hasan (portfolio: zahidp.com).
Zahid has a rare triple-threat profile:
1. Web3 Growth Leader: Scaled NexGami to 500K+ registered users and $5M raised, leading growth loops, tokenomics, and Web3 BD.
2. Full-Stack Engineer: Computer Science background, modern TypeScript, Next.js, Node.js, and cloud systems architect.
3. Certified Salesforce Developer: Apex, LWC, complex integrations, and CRM workflow automation.

Analyze the following list of candidate posts/news items.
Discard immediately:
- Anyone seeking a job or offering their own services (e.g. "[FOR HIRE]", "hire me", "looking for work", student portfolios).
- Generic recruiting agency spam without a real company name.
- Non-technical or irrelevant articles.

Keep only:
1. Legitimate startups / companies hiring for:
   - "Web3 Growth"
   - "Full-Stack"
   - "Salesforce"
2. Startups that recently announced seed, pre-seed, or venture funding in tech, Web3, AI, or SaaS.

Candidate Posts:
${JSON.stringify(batch, null, 2)}

Return a JSON array of qualifying leads. For each qualifying item, output:
- "raw_id": string matching the post "id" from input
- "company_name": clean company name (e.g. "Monad Labs", "Stripe", "Supabase")
- "website_domain": domain name if known or found (e.g. "monad.xyz") or null
- "signal_type": "early_hiring_post" | "seed_funding"
- "track": "Web3 Growth" | "Full-Stack" | "Salesforce"
- "role_or_headline": specific role or funding headline
- "startup_summary": 1-2 sentence concise summary of product & funding
- "contact_name": founder / poster / hiring lead name if found in text, else null
- "contact_title": e.g. "Founder & CEO", "CTO", "Head of Eng", else null
- "contact_email": valid email address if explicitly in text, else null
- "pitch_hook": a punchy 1-sentence angle connecting their specific needs/product to Zahid's triple-threat profile (NexGami 500K users/$5M raise for Web3, CS full-stack for dev roles, Apex/LWC for Salesforce).

If none qualify, return an empty array [].`;

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini] ${model} status ${res.status}: ${errText.slice(0, 120)}`);
        continue;
      }

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);
      const leads = Array.isArray(parsed) ? parsed : parsed?.leads || parsed?.items || [];
      return leads;
    } catch (err) {
      console.warn(`[Gemini] Model ${model} failed:`, err.message);
    }
  }

  return [];
}

// -----------------------------------------------------------------------------
// 4. Hunter.io Email Enrichment (Rate limited to MAX_HUNTER_CALLS_PER_RUN)
// -----------------------------------------------------------------------------
async function enrichWithHunter(apiKey, domain, contactName) {
  if (!apiKey || !domain || !contactName) return null;
  const parts = contactName.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  try {
    const url = `https://api.hunter.io/v2/email-finder?domain=${encodeURIComponent(domain)}&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}&api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.data?.email) {
      return {
        email: json.data.email,
        confidence: json.data.score >= 80 ? 'verified' : 'guessed',
      };
    }
  } catch (err) {
    console.warn('[Hunter.io] Enrichment error:', err.message);
  }
  return null;
}

// -----------------------------------------------------------------------------
// 5. Existing Career Applications Deduplication
// -----------------------------------------------------------------------------
async function getExistingCareerCompanies(supabase) {
  const existing = new Set();

  if (supabase) {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'career_applications')
        .maybeSingle();

      if (data?.value) {
        const apps = Array.isArray(data.value) ? data.value : data.value?.data || [];
        for (const a of apps) {
          if (a.company_name) existing.add(normalizeCompany(a.company_name));
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const p = path.resolve(process.cwd(), 'src/data/career-applications.json');
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8');
      const parsed = JSON.parse(raw);
      const apps = Array.isArray(parsed) ? parsed : parsed?.data || [];
      for (const a of apps) {
        if (a.company_name) existing.add(normalizeCompany(a.company_name));
      }
    }
  } catch {
    // ignore
  }

  return existing;
}

// -----------------------------------------------------------------------------
// 6. Existing Leads Deduplication
// -----------------------------------------------------------------------------
async function getExistingLeadKeys(supabase) {
  const urls = new Set();
  const companyRoles = new Set();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('startup_leads')
        .select('source_url, normalized_company, role_or_headline');

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          if (row.source_url) urls.add(row.source_url);
          if (row.normalized_company && row.role_or_headline) {
            companyRoles.add(`${row.normalized_company}:::${row.role_or_headline.toLowerCase().trim()}`);
          }
        }
        return { urls, companyRoles };
      }
    } catch {
      // ignore
    }

    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'startup_leads')
        .maybeSingle();

      if (data?.value && Array.isArray(data.value)) {
        for (const row of data.value) {
          if (row.source_url) urls.add(row.source_url);
          if (row.normalized_company && row.role_or_headline) {
            companyRoles.add(`${row.normalized_company}:::${row.role_or_headline.toLowerCase().trim()}`);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return { urls, companyRoles };
}

// -----------------------------------------------------------------------------
// 7. Main Ingestion Orchestrator
// -----------------------------------------------------------------------------
async function main() {
  console.log('================================================================');
  console.log('  Startup Leads & Outreach Radar — Ingestion Worker');
  console.log(`  Run timestamp: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  let supabase = null;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_URL.includes('placeholder')) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    console.log('[Supabase] Initialized server client with service role key.');
  } else {
    console.log('[Supabase] No valid URL or key provided; running in dry/offline mode.');
  }

  // 1. Fetch from all free sources
  console.log('[Sources] Fetching Reddit feeds (r/forhire, r/Web3Jobs, r/CryptoJobs, r/salesforce, r/startups)...');
  const subreddits = ['forhire', 'Web3Jobs', 'CryptoJobs', 'salesforce', 'startups'];
  const redditResults = await Promise.all(subreddits.map((s) => fetchRedditSubreddit(s)));
  const redditPosts = redditResults.flat();
  console.log(`[Sources] Reddit: fetched ${redditPosts.length} hiring candidates.`);

  console.log('[Sources] Fetching Hacker News (hiring stories & Ask HN Who is hiring)...');
  const hnPosts = await fetchHackerNews();
  console.log(`[Sources] Hacker News: fetched ${hnPosts.length} candidates.`);

  console.log('[Sources] Fetching Seed Funding RSS (CoinDesk, The Block, TechCrunch, Decrypt)...');
  const rssPosts = await fetchSeedFundingFeeds();
  console.log(`[Sources] Seed Funding RSS: fetched ${rssPosts.length} articles.`);

  const allRawPosts = [...redditPosts, ...hnPosts, ...rssPosts];
  console.log(`\n[Triage] Total raw candidates across all sources: ${allRawPosts.length}`);

  if (allRawPosts.length === 0) {
    console.log('[Done] No raw candidates found this run. Exiting.');
    return;
  }

  // Deduplicate raw posts by URL before AI
  const seenUrls = new Set();
  const uniqueRawPosts = [];
  for (const p of allRawPosts) {
    if (!seenUrls.has(p.url)) {
      seenUrls.add(p.url);
      uniqueRawPosts.push(p);
    }
  }
  console.log(`[Triage] Unique raw candidate URLs: ${uniqueRawPosts.length}`);

  // 2. Load existing career applications and leads to pre-filter
  const careerCompanies = await getExistingCareerCompanies(supabase);
  const { urls: existingLeadUrls, companyRoles: existingCompanyRoles } = await getExistingLeadKeys(supabase);
  console.log(`[Deduplication] Existing career companies loaded: ${careerCompanies.size}`);
  console.log(`[Deduplication] Existing leads loaded: ${existingLeadUrls.size}`);

  const candidatesToQualify = uniqueRawPosts.filter((p) => !existingLeadUrls.has(p.url));
  console.log(`[Triage] Unseen candidates sent to Gemini AI: ${candidatesToQualify.length}`);

  // 3. Batch process through Google Gemini
  const batchSize = 6;
  const qualifiedLeads = [];

  if (!GEMINI_API_KEY) {
    console.log('[Gemini] No GEMINI_API_KEY set; skipping AI triage and qualification.');
  } else {
    for (let i = 0; i < candidatesToQualify.length; i += batchSize) {
      const batch = candidatesToQualify.slice(i, i + batchSize);
      console.log(`[Gemini] Processing batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(candidatesToQualify.length / batchSize)}...`);
      const results = await triageWithGemini(GEMINI_API_KEY, batch);
      for (const res of results) {
        const orig = batch.find((b) => b.id === res.raw_id);
        if (orig && res.company_name) {
          qualifiedLeads.push({
            ...res,
            source_url: orig.url,
            post_published_at: orig.created_at,
          });
        }
      }
    }
  }

  console.log(`\n[AI Qualification] Gemini qualified ${qualifiedLeads.length} leads.`);

  // 4. Enrich contacts (Hunter.io) up to free limit
  let hunterCallsCount = 0;
  if (HUNTER_API_KEY) {
    for (const lead of qualifiedLeads) {
      if (!lead.contact_email && lead.website_domain && lead.contact_name && hunterCallsCount < MAX_HUNTER_CALLS_PER_RUN) {
        console.log(`[Hunter.io] Enriching email for ${lead.contact_name} @ ${lead.website_domain}...`);
        const enrichment = await enrichWithHunter(HUNTER_API_KEY, lead.website_domain, lead.contact_name);
        hunterCallsCount++;
        if (enrichment) {
          lead.contact_email = enrichment.email;
          lead.email_confidence = enrichment.confidence;
          console.log(`[Hunter.io] Found email: ${lead.contact_email} (${lead.email_confidence})`);
        } else {
          lead.email_confidence = 'missing';
        }
      } else if (!lead.contact_email) {
        lead.email_confidence = 'missing';
      } else {
        lead.email_confidence = 'extracted';
      }
    }
  } else {
    for (const lead of qualifiedLeads) {
      lead.email_confidence = lead.contact_email ? 'extracted' : 'missing';
    }
  }

  // 5. Final deduplication & Supabase insert
  let insertedCount = 0;
  let duplicatesSkipped = 0;
  let careerSkipped = 0;

  for (const lead of qualifiedLeads) {
    const norm = normalizeCompany(lead.company_name);
    if (!norm) continue;

    // Rule 1: Check existing Career Pipeline
    if (careerCompanies.has(norm)) {
      careerSkipped++;
      continue;
    }

    // Rule 2: Check source_url
    if (existingLeadUrls.has(lead.source_url)) {
      duplicatesSkipped++;
      continue;
    }

    // Rule 3: Check (normalized_company, role_or_headline)
    const roleKey = `${norm}:::${(lead.role_or_headline || '').toLowerCase().trim()}`;
    if (existingCompanyRoles.has(roleKey)) {
      duplicatesSkipped++;
      continue;
    }

    const leadPayload = {
      source_url: lead.source_url,
      normalized_company: norm,
      company_name: lead.company_name.trim(),
      website_domain: lead.website_domain?.trim() || null,
      signal_type: lead.signal_type === 'seed_funding' ? 'seed_funding' : 'early_hiring_post',
      track: ['Web3 Growth', 'Salesforce'].includes(lead.track) ? lead.track : 'Full-Stack',
      role_or_headline: lead.role_or_headline?.trim() || 'Software Engineer',
      startup_summary: lead.startup_summary?.trim() || null,
      contact_name: lead.contact_name?.trim() || null,
      contact_title: lead.contact_title?.trim() || null,
      contact_email: lead.contact_email?.trim() || null,
      email_confidence: lead.email_confidence || 'missing',
      pitch_hook: lead.pitch_hook?.trim() || null,
      status: 'new',
      post_published_at: lead.post_published_at || new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { error } = await supabase.from('startup_leads').insert(leadPayload);
        if (!error) {
          insertedCount++;
          existingLeadUrls.add(leadPayload.source_url);
          existingCompanyRoles.add(roleKey);
        } else {
          // If unique conflict
          if (error.code === '23505') {
            duplicatesSkipped++;
          } else {
            console.warn('[Supabase] Insert error:', error.message);
          }
        }
      } catch (err) {
        console.warn('[Supabase] Insert failed:', err.message);
      }
    } else {
      // Local dry mode counter
      insertedCount++;
      existingLeadUrls.add(leadPayload.source_url);
      existingCompanyRoles.add(roleKey);
    }
  }

  // 6. Summary Output
  console.log('\n================================================================');
  console.log('  RUN SUMMARY');
  console.log('================================================================');
  console.log(`  Raw candidates fetched:        ${allRawPosts.length}`);
  console.log(`  AI Qualified leads:            ${qualifiedLeads.length}`);
  console.log(`  Career Pipeline duplicates:    ${careerSkipped}`);
  console.log(`  Cross-post duplicates skipped: ${duplicatesSkipped}`);
  console.log(`  Successfully inserted:         ${insertedCount}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('[Fatal Error]', err);
  process.exit(1);
});
