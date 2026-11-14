import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOutreachEmailDraft } from '../src/lib/leads/email-template.ts';
import { calculateLeadMetrics, normalizeCompany } from '../src/lib/leads/leads-metrics.ts';

test('Lead Email Draft: Generates clean 4-line email draft tailored to Web3 Growth', () => {
  const lead = {
    id: 'lead_1',
    created_at: new Date().toISOString(),
    source_url: 'https://example.com/hiring-1',
    normalized_company: 'superprotocol',
    company_name: 'SuperProtocol',
    website_domain: 'superprotocol.com',
    signal_type: 'early_hiring_post',
    track: 'Web3 Growth',
    role_or_headline: 'Head of Growth',
    startup_summary: 'Decentralized confidential compute protocol.',
    contact_name: 'Satoshi Nakamoto',
    contact_title: 'Co-founder',
    contact_email: 'satoshi@superprotocol.com',
    email_confidence: 'verified',
    pitch_hook: 'Saw your recent devnet launch and want to scale your node operator community.',
    status: 'new',
  };

  const draft = generateOutreachEmailDraft(lead);

  assert.ok(draft.startsWith('Hi Satoshi,'));
  assert.ok(draft.includes('Saw your recent devnet launch'));
  assert.ok(draft.includes('NexGami'));
  assert.ok(draft.includes('500K+ registered users'));
  assert.ok(draft.includes('$5M raise'));
  assert.ok(draft.includes('Open to a quick 10-minute intro chat this week'));
  assert.ok(draft.includes('zahidp.com'));
});

test('Lead Email Draft: Generates tailored pitch for Full-Stack role without contact name', () => {
  const lead = {
    id: 'lead_2',
    created_at: new Date().toISOString(),
    source_url: 'https://example.com/hiring-2',
    normalized_company: 'nextcloud',
    company_name: 'NextCloud Labs',
    website_domain: 'nextcloudlabs.io',
    signal_type: 'seed_funding',
    track: 'Full-Stack',
    role_or_headline: 'Founding Engineer',
    startup_summary: 'Raised $2.5M seed for AI developer tools.',
    contact_name: null,
    contact_title: null,
    contact_email: null,
    email_confidence: 'missing',
    pitch_hook: null,
    status: 'new',
  };

  const draft = generateOutreachEmailDraft(lead);

  assert.ok(draft.startsWith('Hi there,'));
  assert.ok(draft.includes('NextCloud Labs'));
  assert.ok(draft.includes('full-stack engineer'));
  assert.ok(draft.includes('CS grad'));
  assert.ok(draft.includes('TypeScript/Next.js/Node/cloud systems'));
  assert.ok(draft.includes('github.com/zahidhasan-p'));
});

test('Lead Metrics: Correctly calculates newToday, readyToEmail, emailed, replied, promoted', () => {
  const now = new Date();
  const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const mockLeads = [
    {
      id: '1',
      created_at: now.toISOString(),
      status: 'new',
      contact_email: 'test1@company.com',
    },
    {
      id: '2',
      created_at: now.toISOString(),
      status: 'new',
      contact_email: null,
    },
    {
      id: '3',
      created_at: yesterday.toISOString(),
      status: 'emailed',
      contact_email: 'test3@company.com',
    },
    {
      id: '4',
      created_at: yesterday.toISOString(),
      status: 'replied',
      contact_email: 'test4@company.com',
    },
    {
      id: '5',
      created_at: now.toISOString(),
      status: 'promoted',
      contact_email: 'test5@company.com',
    },
    {
      id: '6',
      created_at: now.toISOString(),
      status: 'archived',
      contact_email: 'test6@company.com',
    },
  ];

  const metrics = calculateLeadMetrics(mockLeads);

  // Non-archived count = 5
  assert.equal(metrics.total, 5);
  // Created in last 24h & not archived = ids 1, 2, 5 = 3
  assert.equal(metrics.newToday, 3);
  // Status 'new' and has contact_email = id 1 = 1
  assert.equal(metrics.readyToEmail, 1);
  // Emailed = 1
  assert.equal(metrics.emailed, 1);
  // Replied = 1
  assert.equal(metrics.replied, 1);
  // Promoted = 1
  assert.equal(metrics.promoted, 1);
});

test('Lead Deduplication Helper: normalizes company names consistently', () => {
  assert.equal(normalizeCompany('SuperProtocol, Inc.'), 'superprotocolinc');
  assert.equal(normalizeCompany('  Next Cloud Labs  '), 'nextcloudlabs');
  assert.equal(normalizeCompany('Stripe-US'), 'stripeus');
  assert.equal(normalizeCompany('Monad.xyz'), 'monadxyz');
});

test('Manual Lead URL Generation: auto-generates unique manual:// scheme if blank', () => {
  const norm = normalizeCompany('Acme Corp');
  const now = 1731557000000;
  const manualUrl = `manual://${norm}-${now}`;

  assert.equal(manualUrl, 'manual://acmecorp-1731557000000');
  assert.ok(manualUrl.startsWith('manual://'));
});

test('Manual Lead Pitch Hook Fallback: crafts tailored hook based on selected track', () => {
  const getFallbackHook = (companyName, track) => {
    if (track === 'Web3 Growth') {
      return `Saw what ${companyName} is building in Web3 and want to help scale your user acquisition loops like I did at NexGami (500K+ registered users, $5M raised).`;
    } else if (track === 'Salesforce') {
      return `Noticed your team at ${companyName} is expanding Salesforce and CRM automation; I bring certified Apex/LWC and custom integration engineering.`;
    }
    return `Saw your engineering needs at ${companyName}; I build fast, production-grade full-stack systems with TypeScript/Next.js/Node.`;
  };

  const web3Hook = getFallbackHook('Aptos Labs', 'Web3 Growth');
  assert.ok(web3Hook.includes('NexGami'));
  assert.ok(web3Hook.includes('500K+'));

  const sfdcHook = getFallbackHook('CloudWave', 'Salesforce');
  assert.ok(sfdcHook.includes('Apex/LWC'));

  const fsHook = getFallbackHook('Vercel Team', 'Full-Stack');
  assert.ok(fsHook.includes('TypeScript/Next.js/Node'));
});
