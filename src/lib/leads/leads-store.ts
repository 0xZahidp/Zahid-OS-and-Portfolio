import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import {
  StartupLead,
  StartupLeadMetrics,
  StartupLeadTrack,
  StartupLeadSignalType,
  StartupLeadEmailConfidence,
  StartupLeadStatus,
} from '@/types/leads';
import { getCareerApplications, saveCareerApplications } from '@/lib/career/career-store';
import { CareerApplication } from '@/types/career';
import { calculateLeadMetrics, normalizeCompany } from './leads-metrics';
import { lookupHunterEmail } from './hunter';

export { calculateLeadMetrics, normalizeCompany };

export interface CreateLeadInput {
  company_name: string;
  role_or_headline: string;
  source_url?: string | null;
  track?: StartupLeadTrack;
  signal_type?: StartupLeadSignalType;
  website_domain?: string | null;
  contact_name?: string | null;
  contact_title?: string | null;
  contact_email?: string | null;
  email_confidence?: StartupLeadEmailConfidence;
  startup_summary?: string | null;
  pitch_hook?: string | null;
  status?: StartupLeadStatus;
  try_hunter?: boolean;
  hunter_api_key?: string;
}

const LEADS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'startup-leads.json');

let memoryCache: { leads: StartupLead[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000;

/**
 * Read all leads from Supabase startup_leads table, with fallback to site_settings or local JSON.
 */
export async function getAllLeads(): Promise<StartupLead[]> {
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_TTL_MS) {
    return memoryCache.leads;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try dedicated startup_leads table in Supabase
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('startup_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        memoryCache = { leads: data as StartupLead[], timestamp: Date.now() };
        return data as StartupLead[];
      }

      // If table does not exist yet (schema cache missing), try fallback to site_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'startup_leads')
        .maybeSingle();

      if (!settingsError && settingsData?.value && Array.isArray(settingsData.value)) {
        memoryCache = { leads: settingsData.value as StartupLead[], timestamp: Date.now() };
        return settingsData.value as StartupLead[];
      }
    } catch (err) {
      console.warn('[LeadsStore] Supabase read failed, checking local fallback:', err);
    }
  }

  // 2. Fallback to local JSON file
  try {
    const raw = await fs.readFile(LEADS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryCache = { leads: parsed, timestamp: Date.now() };
      return parsed;
    }
  } catch {
    // If file doesn't exist, return empty array
  }

  return [];
}

/**
 * Save leads list to fallback storage (site_settings / local file) when dedicated table isn't present
 */
async function saveLeadsFallback(leads: StartupLead[]): Promise<void> {
  memoryCache = { leads, timestamp: Date.now() };

  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(LEADS_FILE_PATH, JSON.stringify(leads, null, 2), 'utf-8');
    } catch {
      // ignore
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      await supabase.from('site_settings').upsert(
        {
          key: 'startup_leads',
          value: leads,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    } catch {
      // ignore
    }
  }
}

/**
 * Filter and query leads with computed metrics
 */
export async function getFilteredLeads(options: {
  track?: string;
  signal_type?: string;
  status?: string;
  search?: string;
  include_archived?: boolean;
} = {}): Promise<{ leads: StartupLead[]; metrics: StartupLeadMetrics }> {
  const all = await getAllLeads();
  const metrics = calculateLeadMetrics(all);

  let filtered = all;

  // Filter archived
  if (!options.include_archived) {
    if (options.status === 'archived') {
      filtered = filtered.filter((l) => l.status === 'archived');
    } else {
      filtered = filtered.filter((l) => l.status !== 'archived');
    }
  }

  // Filter by track
  if (options.track && options.track !== 'all') {
    filtered = filtered.filter((l) => l.track === options.track);
  }

  // Filter by signal_type
  if (options.signal_type && options.signal_type !== 'all') {
    filtered = filtered.filter((l) => l.signal_type === options.signal_type);
  }

  // Filter by status
  if (options.status && options.status !== 'all') {
    if (options.status === 'ready_to_email') {
      filtered = filtered.filter(
        (l) => l.status === 'new' && l.contact_email && l.contact_email.trim().length > 0
      );
    } else {
      filtered = filtered.filter((l) => l.status === options.status);
    }
  }

  // Search filter
  if (options.search && options.search.trim()) {
    const q = options.search.toLowerCase().trim();
    filtered = filtered.filter((l) => {
      return (
        l.company_name?.toLowerCase().includes(q) ||
        l.role_or_headline?.toLowerCase().includes(q) ||
        l.startup_summary?.toLowerCase().includes(q) ||
        l.pitch_hook?.toLowerCase().includes(q) ||
        l.contact_name?.toLowerCase().includes(q) ||
        l.contact_email?.toLowerCase().includes(q) ||
        l.contact_title?.toLowerCase().includes(q) ||
        l.website_domain?.toLowerCase().includes(q)
      );
    });
  }

  return { leads: filtered, metrics };
}

/**
 * Update a lead by ID
 */
export async function updateLead(
  id: string,
  updates: Partial<StartupLead>
): Promise<StartupLead | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase table
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('startup_leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        memoryCache = null; // Invalidate cache
        return data as StartupLead;
      }
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback in-memory / site_settings / json
  const all = await getAllLeads();
  const idx = all.findIndex((l) => l.id === id);
  if (idx === -1) return null;

  const updated: StartupLead = {
    ...all[idx],
    ...updates,
  };
  all[idx] = updated;

  await saveLeadsFallback(all);
  return updated;
}

/**
 * Get a lead by ID
 */
export async function getLeadById(id: string): Promise<StartupLead | null> {
  const all = await getAllLeads();
  return all.find((l) => l.id === id) || null;
}

/**
 * Permanently delete a lead by ID from Supabase startup_leads and fallback storage
 */
export async function deleteLead(id: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase table
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.from('startup_leads').delete().eq('id', id);
      if (!error) {
        memoryCache = null; // Invalidate cache
        return true;
      }
    } catch {
      // Fallback below
    }
  }

  // 2. Fallback in-memory / site_settings / json
  const all = await getAllLeads();
  const filtered = all.filter((l) => l.id !== id);
  if (filtered.length !== all.length) {
    await saveLeadsFallback(filtered);
    memoryCache = null;
    return true;
  }
  return false;
}

/**
 * Manually create a new startup lead with strict deduplication
 */
export async function createLead(input: CreateLeadInput): Promise<StartupLead> {
  const companyName = input.company_name?.trim();
  const roleOrHeadline = input.role_or_headline?.trim();

  if (!companyName) {
    throw new Error('Company name is required');
  }
  if (!roleOrHeadline) {
    throw new Error('Role or headline is required');
  }

  const normalizedCompany = normalizeCompany(companyName);

  // 1. Check existing Career & Pipeline tracker
  const { applications } = await getCareerApplications();
  const alreadyInCareer = applications.some(
    (app) => normalizeCompany(app.company_name) === normalizedCompany
  );
  if (alreadyInCareer) {
    const err = new Error(`Company "${companyName}" already exists in your Career & Pipeline tracker.`);
    (err as unknown as { status: number }).status = 409;
    throw err;
  }

  // 2. Check existing leads in radar
  const existingLeads = await getAllLeads();

  // Determine source_url
  let sourceUrl = input.source_url?.trim();
  if (!sourceUrl) {
    sourceUrl = `manual://${normalizedCompany}-${Date.now()}`;
  }

  const existingByUrl = existingLeads.find((l) => l.source_url === sourceUrl);
  if (existingByUrl) {
    const err = new Error('A lead with this Source URL already exists in Leads Radar.');
    (err as unknown as { status: number }).status = 409;
    throw err;
  }

  const existingByCompanyRole = existingLeads.find(
    (l) =>
      l.normalized_company === normalizedCompany &&
      l.role_or_headline.toLowerCase().trim() === roleOrHeadline.toLowerCase().trim()
  );
  if (existingByCompanyRole) {
    const err = new Error(
      `A lead for "${companyName}" with role "${roleOrHeadline}" already exists in Leads Radar.`
    );
    (err as unknown as { status: number }).status = 409;
    throw err;
  }

  // 3. Email & Hunter enrichment
  let contactEmail = input.contact_email?.trim() || null;
  let emailConfidence = input.email_confidence || (contactEmail ? 'extracted' : 'missing');

  if (!contactEmail && input.try_hunter && input.website_domain && input.contact_name) {
    try {
      const hunterRes = await lookupHunterEmail(input.website_domain, input.contact_name, input.hunter_api_key);
      if (hunterRes) {
        contactEmail = hunterRes.email;
        emailConfidence = hunterRes.confidence;
      }
    } catch {
      // ignore
    }
  }

  // 4. Default pitch hook if not provided
  let pitchHook = input.pitch_hook?.trim() || null;
  if (!pitchHook) {
    const track = input.track || 'Full-Stack';
    if (track === 'Web3 Growth') {
      pitchHook = `Saw what ${companyName} is building in Web3 and want to help scale your user acquisition loops like I did at NexGami (500K+ users, $5M raised).`;
    } else if (track === 'Salesforce') {
      pitchHook = `Noticed your team at ${companyName} is expanding Salesforce and CRM automation; I bring certified Apex/LWC and custom integration engineering.`;
    } else {
      pitchHook = `Saw your engineering needs at ${companyName}; I build fast, production-grade full-stack systems with TypeScript/Next.js/Node.`;
    }
  }

  const newLead: StartupLead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    source_url: sourceUrl,
    normalized_company: normalizedCompany,
    company_name: companyName,
    website_domain: input.website_domain?.trim() || null,
    signal_type: input.signal_type || 'early_hiring_post',
    track: input.track || 'Full-Stack',
    role_or_headline: roleOrHeadline,
    startup_summary: input.startup_summary?.trim() || null,
    contact_name: input.contact_name?.trim() || null,
    contact_title: input.contact_title?.trim() || null,
    contact_email: contactEmail,
    email_confidence: emailConfidence,
    pitch_hook: pitchHook,
    status: input.status && ['new', 'emailed', 'replied', 'promoted', 'archived'].includes(input.status)
      ? input.status
      : 'new',
    post_published_at: new Date().toISOString(),
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 5. Try Supabase dedicated table
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('startup_leads')
        .insert({
          source_url: newLead.source_url,
          normalized_company: newLead.normalized_company,
          company_name: newLead.company_name,
          website_domain: newLead.website_domain,
          signal_type: newLead.signal_type,
          track: newLead.track,
          role_or_headline: newLead.role_or_headline,
          startup_summary: newLead.startup_summary,
          contact_name: newLead.contact_name,
          contact_title: newLead.contact_title,
          contact_email: newLead.contact_email,
          email_confidence: newLead.email_confidence,
          pitch_hook: newLead.pitch_hook,
          status: newLead.status,
          post_published_at: newLead.post_published_at,
        })
        .select()
        .single();

      if (!error && data) {
        memoryCache = null;
        return data as StartupLead;
      }

      if (error?.code === '23505') {
        const err = new Error('Lead already exists in Leads Radar (unique constraint).');
        (err as unknown as { status: number }).status = 409;
        throw err;
      }
    } catch (err: unknown) {
      if ((err as { status?: number })?.status === 409) {
        throw err;
      }
      // Fallback below
    }
  }

  // 6. Fallback storage (site_settings / local JSON)
  const updatedList = [newLead, ...existingLeads];
  await saveLeadsFallback(updatedList);
  return newLead;
}

/**
 * Promote lead directly to Career & Pipeline as 'applied'
 */
export async function promoteLeadToCareerPipeline(
  leadId: string
): Promise<{ success: boolean; application?: CareerApplication; error?: string }> {
  const all = await getAllLeads();
  const lead = all.find((l) => l.id === leadId);
  if (!lead) {
    return { success: false, error: 'Lead not found' };
  }

  const { applications } = await getCareerApplications();

  // Create new career application
  const domain = lead.website_domain?.trim();
  const webUrl = domain ? (domain.startsWith('http') ? domain : `https://${domain}`) : '';

  const newApp: CareerApplication = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    company_name: lead.company_name.trim(),
    company_website: webUrl,
    company_location: '',
    role_title: lead.role_or_headline.trim() || 'Software Engineer',
    type: 'job',
    status: 'applied',
    priority: 'high',
    stageChangedAt: new Date().toISOString(),
    source: lead.track === 'Web3 Growth' ? 'web3_board' : 'company_site',
    source_detail: `Startup Radar (${lead.signal_type === 'early_hiring_post' ? 'Hiring Post' : 'Seed Funding'})`,
    source_url: lead.source_url,
    remote_type: 'remote',
    employment_type: 'full_time',
    applied_date: new Date().toISOString(),
    salary_currency: 'USD',
    salary_period: 'yearly',
    notes: [
      lead.startup_summary ? `Startup Summary:\n${lead.startup_summary}` : '',
      lead.pitch_hook ? `Tailored Pitch Angle:\n${lead.pitch_hook}` : '',
      `Original Source: ${lead.source_url}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    contacts: lead.contact_name
      ? [
          {
            id: `cnt_${Date.now()}`,
            name: lead.contact_name.trim(),
            role: 'hiring_manager',
            email: lead.contact_email?.trim() || undefined,
            notes: lead.contact_title?.trim() || 'Outreach Contact',
          },
        ]
      : [],
    interviews: [],
    archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Prepend to career applications and save
  const updatedApps = [newApp, ...applications];
  await saveCareerApplications(updatedApps);

  // Update lead status to promoted
  await updateLead(leadId, { status: 'promoted' });

  return { success: true, application: newApp };
}
