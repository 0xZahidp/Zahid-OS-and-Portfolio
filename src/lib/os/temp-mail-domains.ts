import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';
import { supabaseServer } from '@/lib/supabase/server';
import { getAppSecret, setAppSecret, deleteAppSecret } from '@/lib/env-vault';

export interface TempMailDnsRecord {
  record: string;
  type: string;
  name: string;
  value: string;
  priority?: number;
  status?: string;
  ttl?: string;
}

export interface TempMailDomainRecord {
  id: string;
  domain: string;
  status: 'verified' | 'pending' | 'not_started' | 'active';
  resendDomainId?: string;
  resendApiKey?: string;
  resendApiKeyMasked?: string;
  hasCustomKey?: boolean;
  dnsRecords?: TempMailDnsRecord[];
  isReceivingReady?: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

const DOMAINS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'temp-mail-domains.json');

let memoryDomainsCache: { domains: TempMailDomainRecord[]; defaultDomain: string; timestamp: number } | null = null;
const CACHE_TTL_MS = 15000; // 15s cache

function maskApiKey(key: string): string {
  if (!key || key.length < 4) return '••••••••';
  return `••••••••••••${key.slice(-4)}`;
}

function sanitizeMaskedKey(masked?: string): string | undefined {
  if (!masked) return undefined;
  const last4 = masked.slice(-4);
  return `••••••••••••${last4}`;
}

/**
 * Retrieve all registered Temp Mail domains with 3-tier fallback:
 * 1. Supabase site_settings (key: 'temp_mail_domains')
 * 2. Local JSON file ('src/data/temp-mail-domains.json')
 * 3. Fallback default domain from environment
 */
export async function getTempMailDomains(): Promise<{
  domains: TempMailDomainRecord[];
  defaultDomain: string;
}> {
  // In-memory cache check
  if (memoryDomainsCache && Date.now() - memoryDomainsCache.timestamp < CACHE_TTL_MS) {
    return {
      domains: memoryDomainsCache.domains,
      defaultDomain: memoryDomainsCache.defaultDomain,
    };
  }

  let list: TempMailDomainRecord[] = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase site_settings
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'temp_mail_domains')
        .maybeSingle();

      if (!error && data?.value && Array.isArray(data.value)) {
        list = data.value as TempMailDomainRecord[];
      }
    } catch (err) {
      console.warn('[TempMailDomains] Supabase read fallback:', err);
    }
  }

  // 2. Try Local JSON file if Supabase returned empty
  if (list.length === 0) {
    try {
      const raw = await fs.readFile(DOMAINS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        list = parsed;
      }
    } catch {
      // Fallback
    }
  }

  // 3. If still empty, seed default primary domain
  if (list.length === 0) {
    let fallback = 'localhost';
    try {
      const envDomain = process.env.TEMP_MAIL_DOMAIN;
      const defaultSender =
        (await getAppSecret('RESEND_DEFAULT_SENDER')) || process.env.RESEND_DEFAULT_SENDER;

      if (envDomain && envDomain.trim()) {
        fallback = envDomain.trim().toLowerCase();
      } else if (defaultSender) {
        const match = defaultSender.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (match && match[1]) fallback = match[1].toLowerCase();
      } else {
        fallback = 'zahidp.com';
      }
    } catch {
      fallback = 'zahidp.com';
    }

    const defaultSeed: TempMailDomainRecord = {
      id: `dom_${Date.now()}`,
      domain: fallback,
      status: 'verified',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list = [defaultSeed];
  }

  const defaultItem = list.find((d) => d.isDefault) || list[0];
  const defaultDomain = defaultItem?.domain || 'zahidp.com';

  memoryDomainsCache = {
    domains: list,
    defaultDomain,
    timestamp: Date.now(),
  };

  const sanitizedList = list.map((d) => ({
    ...d,
    resendApiKey: undefined,
    resendApiKeyMasked: d.hasCustomKey ? sanitizeMaskedKey(d.resendApiKeyMasked) : undefined,
  }));

  return { domains: sanitizedList, defaultDomain };
}

/**
 * Persist domains to Supabase site_settings and local JSON file
 */
export async function saveDomainsToStore(domains: TempMailDomainRecord[]): Promise<boolean> {
  let fileSaved = false;
  let supabaseSaved = false;

  // Strip raw API key from persisted JSON/settings (keys are stored safely in app_settings vault)
  const sanitized = domains.map((d) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { resendApiKey, ...clean } = d;
    return {
      ...clean,
      resendApiKey: undefined,
      resendApiKeyMasked: clean.hasCustomKey ? sanitizeMaskedKey(clean.resendApiKeyMasked) : undefined,
    } as TempMailDomainRecord;
  });

  // 1. Local file (safely ignore EROFS on read-only environments, skip on Vercel)
  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(DOMAINS_FILE_PATH, JSON.stringify(sanitized, null, 2), 'utf-8');
      fileSaved = true;
    } catch (err) {
      console.warn('[TempMailDomains] Local file write skipped (read-only environment):', err);
    }
  }

  // 2. Supabase site_settings
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.from('site_settings').upsert(
        {
          key: 'temp_mail_domains',
          value: sanitized,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
      if (!error) {
        supabaseSaved = true;
      } else {
        console.warn('[TempMailDomains] Supabase save error:', error.message);
      }
    } catch (err) {
      console.warn('[TempMailDomains] Supabase save error:', err);
    }
  }

  if (!fileSaved && !supabaseSaved) {
    throw new Error('Failed to save temp mail domains to storage');
  }

  const defaultItem = domains.find((d) => d.isDefault) || domains[0];
  memoryDomainsCache = {
    domains,
    defaultDomain: defaultItem?.domain || 'zahidp.com',
    timestamp: Date.now(),
  };

  return true;
}

/**
 * Resolve the exact Resend API key for a specific domain.
 * 1. Specific key stored on domain record
 * 2. Specific key in Supabase vault (`RESEND_KEY_<DOMAIN>`)
 * 3. Global RESEND_API_KEY
 */
export async function getResendKeyForDomain(domain?: string): Promise<string | undefined> {
  if (domain) {
    const clean = domain.toLowerCase().trim();
    const { domains } = await getTempMailDomains();
    const match = domains.find((d) => d.domain.toLowerCase() === clean);

    if (match?.resendApiKey && match.resendApiKey.startsWith('re_')) {
      return match.resendApiKey;
    }

    try {
      const vaultKey = await getAppSecret(
        `RESEND_KEY_${clean.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
      );
      if (vaultKey && vaultKey.startsWith('re_')) {
        return vaultKey;
      }
    } catch {
      // ignore
    }
  }

  return (await getAppSecret('RESEND_API_KEY')) || process.env.RESEND_API_KEY;
}

function sortDnsRecords(records: TempMailDnsRecord[]): TempMailDnsRecord[] {
  return [...records]
    .map((r) => ({
      ...r,
      name: !r.name || r.name.trim() === '' ? '@' : r.name,
    }))
    .sort((a, b) => {
      // MX records for receiving at top
      if (a.type === 'MX' && b.type !== 'MX') return -1;
      if (b.type === 'MX' && a.type !== 'MX') return 1;
      return 0;
    });
}

/**
 * Add a new domain to Temp Mail, validating with Resend API if provided
 */
export async function addTempMailDomain(params: {
  domain: string;
  resendApiKey?: string;
  isDefault?: boolean;
}): Promise<{
  success: boolean;
  domain?: TempMailDomainRecord;
  error?: string;
  resendVerified?: boolean;
  dnsRecords?: TempMailDnsRecord[];
}> {
  let cleanDomain = (params.domain || '').trim().toLowerCase();
  cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/@.*$/, '');

  if (!cleanDomain || !cleanDomain.includes('.') || cleanDomain.length < 4) {
    return { success: false, error: 'Please enter a valid domain name (e.g. mail.yourdomain.com).' };
  }

  const { domains } = await getTempMailDomains();
  const existing = domains.find((d) => d.domain.toLowerCase() === cleanDomain);
  if (existing) {
    return { success: false, error: `Domain '${cleanDomain}' is already added in the Temp Mail system.` };
  }

  // Resolve API Key: custom key provided OR existing system key
  let apiKey = (params.resendApiKey || '').trim();
  const hasCustomKey = Boolean(apiKey && apiKey.startsWith('re_'));

  if (!apiKey) {
    apiKey = (await getAppSecret('RESEND_API_KEY')) || process.env.RESEND_API_KEY || '';
  }

  let resendDomainId: string | undefined;
  let domainStatus: TempMailDomainRecord['status'] = 'active';
  let dnsRecords: TempMailDnsRecord[] | undefined;
  let resendVerified = false;

  // If we have a Resend API key, query Resend API
  if (apiKey && apiKey.startsWith('re_')) {
    try {
      const resend = new Resend(apiKey);
      const listRes = await resend.domains.list();

      const matchedDomain = listRes.data?.data?.find(
        (d: { name: string }) => d.name.toLowerCase() === cleanDomain
      );

      if (matchedDomain) {
        // Domain already created on Resend
        resendDomainId = matchedDomain.id;
        status = matchedDomain.status === 'verified' ? 'verified' : 'pending';
        resendVerified = matchedDomain.status === 'verified';

        // Fetch detailed DNS records (including MX receiving record)
        try {
          const detailRes = await resend.domains.get(matchedDomain.id);
          if (detailRes.data?.records) {
            dnsRecords = sortDnsRecords(detailRes.data.records as TempMailDnsRecord[]);
          }
        } catch {
          // ignore
        }
      } else {
        // Not yet on Resend: attempt to create domain on Resend
        try {
          const createRes = await resend.domains.create({ name: cleanDomain });
          if (createRes.data) {
            resendDomainId = createRes.data.id;
            status = createRes.data.status === 'verified' ? 'verified' : 'pending';
            resendVerified = createRes.data.status === 'verified';
            if (createRes.data.records) {
              dnsRecords = sortDnsRecords(createRes.data.records as TempMailDnsRecord[]);
            }
          }
        } catch (createErr: unknown) {
          const msg = createErr instanceof Error ? createErr.message : '';
          console.warn('[TempMailDomains] Resend domain create note:', msg);
          status = 'pending';
        }
      }

      // Save custom key safely in Supabase app_settings vault
      if (hasCustomKey) {
        try {
          await setAppSecret(
            `RESEND_KEY_${cleanDomain.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`,
            apiKey,
            true,
            `Resend API key dedicated for domain ${cleanDomain}`
          );
        } catch {
          // vault optional
        }
      }
    } catch (resendErr: unknown) {
      console.warn('[TempMailDomains] Resend API check warning:', resendErr);
      domainStatus = 'pending';
    }
  }

  const isDefault = Boolean(params.isDefault) || domains.length === 0;

  // If this domain is marked default, unmark others
  const updatedList: TempMailDomainRecord[] = domains.map((d) => ({
    ...d,
    isDefault: isDefault ? false : Boolean(d.isDefault),
  }));

  const mxRecord = dnsRecords?.find((r) => r.type === 'MX');
  const isReceivingReady = mxRecord ? mxRecord.status === 'verified' : resendVerified;
  const isDomainVerified = resendVerified && isReceivingReady;

  const newRecord: TempMailDomainRecord = {
    id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    domain: cleanDomain,
    status: isDomainVerified ? 'verified' : domainStatus,
    resendDomainId,
    resendApiKey: undefined,
    resendApiKeyMasked: hasCustomKey ? maskApiKey(apiKey) : undefined,
    hasCustomKey,
    dnsRecords,
    isReceivingReady,
    isDefault,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  updatedList.push(newRecord);
  await saveDomainsToStore(updatedList);

  return {
    success: true,
    domain: {
      ...newRecord,
      resendApiKey: undefined,
    },
    resendVerified,
    dnsRecords,
  };
}

/**
 * Synchronize live DNS verification status from Resend API
 */
export async function syncDomainFromResend(domainOrId: string): Promise<{
  success: boolean;
  domain?: TempMailDomainRecord;
  error?: string;
  isReceivingReady?: boolean;
  isVerified?: boolean;
}> {
  const { domains } = await getTempMailDomains();
  const lower = domainOrId.toLowerCase().trim();
  const match = domains.find((d) => d.id === domainOrId || d.domain.toLowerCase() === lower);
  if (!match) {
    return { success: false, error: 'Domain not found' };
  }

  const apiKey = await getResendKeyForDomain(match.domain);
  if (!apiKey || !apiKey.startsWith('re_')) {
    return { success: false, error: 'No Resend API key configured for domain' };
  }

  try {
    const resend = new Resend(apiKey);
    let resendDomainId = match.resendDomainId;

    if (!resendDomainId) {
      const listRes = await resend.domains.list();
      const found = listRes.data?.data?.find(
        (d: { name: string }) => d.name.toLowerCase() === match.domain
      );
      if (found) {
        resendDomainId = found.id;
      }
    }

    if (!resendDomainId) {
      return { success: false, error: `Domain ${match.domain} is not registered in this Resend account.` };
    }

    // Proactively ask Resend to verify DNS
    try {
      await resend.domains.verify(resendDomainId);
    } catch {
      // ignore
    }

    const detailRes = await resend.domains.get(resendDomainId);
    if (detailRes.error || !detailRes.data) {
      return { success: false, error: detailRes.error?.message || 'Failed to fetch domain records from Resend' };
    }

    const resData = detailRes.data;
    const dnsRecords = sortDnsRecords((resData.records || []) as TempMailDnsRecord[]);
    const mxRecord = dnsRecords.find((r) => r.type === 'MX');
    const isReceivingReady = mxRecord ? mxRecord.status === 'verified' : resData.status === 'verified';
    const isVerified = (resData.status === 'verified' || resData.status === 'partially_verified') && isReceivingReady;
    const status: TempMailDomainRecord['status'] = isVerified ? 'verified' : 'pending';

    const updatedDomains: TempMailDomainRecord[] = domains.map((d) => {
      if (d.id === match.id) {
        return {
          ...d,
          resendDomainId,
          status,
          dnsRecords,
          isReceivingReady,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });

    await saveDomainsToStore(updatedDomains);
    const updatedRecord = updatedDomains.find((d) => d.id === match.id);

    return { success: true, domain: updatedRecord, isReceivingReady, isVerified };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Resend domain sync failed';
    return { success: false, error: msg };
  }
}

/**
 * Remove a domain from Temp Mail
 */
export async function removeTempMailDomain(idOrDomain: string): Promise<boolean> {
  const { domains } = await getTempMailDomains();
  const lower = idOrDomain.toLowerCase().trim();
  const target = domains.find((d) => d.id === idOrDomain || d.domain.toLowerCase() === lower);
  const filtered = domains.filter((d) => d.id !== idOrDomain && d.domain.toLowerCase() !== lower);

  if (filtered.length === domains.length) {
    return false;
  }

  // Ensure there is always at least one default if domains remain
  if (filtered.length > 0 && !filtered.some((d) => d.isDefault)) {
    filtered[0].isDefault = true;
  }

  if (target?.domain) {
    try {
      await deleteAppSecret(`RESEND_KEY_${target.domain.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`);
    } catch {
      // ignore
    }
  }

  return saveDomainsToStore(filtered);
}

/**
 * Set a domain as the default for new temp inboxes
 */
export async function setDefaultTempMailDomain(idOrDomain: string): Promise<boolean> {
  const { domains } = await getTempMailDomains();
  const lower = idOrDomain.toLowerCase().trim();
  const updated: TempMailDomainRecord[] = domains.map((d) => ({
    ...d,
    isDefault: d.id === idOrDomain || d.domain.toLowerCase() === lower,
  }));

  return saveDomainsToStore(updated);
}
