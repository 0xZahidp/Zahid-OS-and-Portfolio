import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { getAppSecret } from '@/lib/env-vault';

export interface TempInboxRecord {
  id: string;
  address: string;
  username: string;
  domain: string;
  token: string;
  ip_hash?: string;
  ttl_seconds: number;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface TempMessageRecord {
  id: string;
  inbox_address: string;
  resend_id?: string;
  from_name: string;
  from_email: string;
  to_email: string;
  subject: string;
  snippet: string;
  body_text: string;
  body_html: string;
  otp_code?: string | null;
  verification_link?: string | null;
  is_read: boolean;
  received_at: string;
  expires_at: string;
}

const LOCAL_STORE_FILE = path.join(process.cwd(), 'src', 'data', 'temp-mail-store.json');

/**
 * Official locked business aliases for the domain.
 * Creating disposable temporary mail with these names is strictly prohibited
 * to ensure important business communications are never intercepted or mixed with temp mail.
 */
export const RESERVED_OFFICIAL_ALIASES = [
  'hello',
  'test',
  'contact',
  'support',
  'reply',
  'noreply',
  'admin',
  'zahid',
  'me',
  'info',
  'billing',
  'security',
] as const;


interface LocalTempStore {
  inboxes: TempInboxRecord[];
  messages: TempMessageRecord[];
}

let memoryTempStore: LocalTempStore | null = null;

async function readLocalStore(): Promise<LocalTempStore> {
  if (memoryTempStore) {
    return memoryTempStore;
  }
  try {
    const raw = await fs.readFile(LOCAL_STORE_FILE, 'utf-8');
    if (!raw || !raw.trim()) {
      memoryTempStore = { inboxes: [], messages: [] };
      return memoryTempStore;
    }
    const parsed = JSON.parse(raw);
    memoryTempStore = {
      inboxes: Array.isArray(parsed?.inboxes) ? parsed.inboxes : [],
      messages: Array.isArray(parsed?.messages) ? parsed.messages : [],
    };
    return memoryTempStore;
  } catch {
    memoryTempStore = { inboxes: [], messages: [] };
    return memoryTempStore;
  }
}

async function writeLocalStore(store: LocalTempStore): Promise<void> {
  memoryTempStore = store;
  try {
    // Purge expired records before saving
    const now = new Date().toISOString();
    const activeInboxes = store.inboxes.filter((i) => i.expires_at > now);
    const activeAddresses = new Set(activeInboxes.map((i) => i.address.toLowerCase()));
    const activeMessages = store.messages.filter(
      (m) => m.expires_at > now && activeAddresses.has(m.inbox_address.toLowerCase())
    );

    await fs.writeFile(
      LOCAL_STORE_FILE,
      JSON.stringify({ inboxes: activeInboxes, messages: activeMessages }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('Failed to write temp-mail-store.json:', err);
  }
}

/**
 * Automatically resolve the user's domain:
 * 1. Default domain from configured Temp Mail Domains system
 * 2. TEMP_MAIL_DOMAIN env var
 * 3. Domain from RESEND_DEFAULT_SENDER (e.g. hello@zahidp.com -> zahidp.com)
 * 4. Request Host (e.g. 0xzahidp.com)
 * 5. Fallback 'zahidp.com'
 */
export async function resolveTempMailDomain(requestHost?: string): Promise<string> {
  // 1. Default domain from Temp Mail Domain System
  try {
    const { getTempMailDomains } = await import('./temp-mail-domains');
    const { defaultDomain, domains } = await getTempMailDomains();
    if (defaultDomain && defaultDomain !== 'localhost') {
      return defaultDomain;
    }
    if (domains.length > 0 && domains[0].domain && domains[0].domain !== 'localhost') {
      return domains[0].domain;
    }
  } catch {
    // fallback
  }

  // 2. Explicit domain env var
  const envDomain = process.env.TEMP_MAIL_DOMAIN;
  if (envDomain && envDomain.trim()) {
    return envDomain.trim().toLowerCase();
  }

  // 3. Sender email domain from secrets
  try {
    const defaultSender =
      (await getAppSecret('RESEND_DEFAULT_SENDER')) || process.env.RESEND_DEFAULT_SENDER;
    if (defaultSender) {
      const match = defaultSender.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }
  } catch {
    // fall through
  }

  // 4. Request host from client / header (e.g. localhost, domain.com)
  if (requestHost) {
    const cleanHost = requestHost.split(':')[0].trim().toLowerCase();
    if (cleanHost && cleanHost !== 'localhost' && cleanHost !== '127.0.0.1') {
      return cleanHost;
    }
  }

  return 'zahidp.com';
}

/**
 * Intelligent OTP and verification link extractor
 */
export function extractOtpAndLink(
  subject = '',
  text = '',
  html = ''
): { otpCode: string | null; verificationLink: string | null } {
  const combined = `${subject}\n${text}\n${html.replace(/<[^>]*>/g, ' ')}`;

  // 1. Explicit OTP keywords + Code (supports numbers or tokens with hyphens like G-123456 or SUPA-9942):
  // Examples: "verification code: 839201", "OTP is 5928", "confirmation token: SUPA-9942"
  const keywordMatch = combined.match(
    /(?:verification|security|confirm(?:ation)?|login|auth(?:entication)?|one-time|otp|passcode|code|token)[\s\w]*?[:is\s-]+([0-9A-Za-z-]{4,10})\b/i
  );

  let otpCode: string | null = null;
  if (keywordMatch && keywordMatch[1] && /\d/.test(keywordMatch[1])) {
    otpCode = keywordMatch[1].trim();
  }

  // 2. High-confidence standalone 6-digit number
  if (!otpCode) {
    const sixDigit = combined.match(/\b(?<![#$])(\d{6})(?!\d)\b/);
    if (sixDigit) {
      otpCode = sixDigit[1];
    }
  }

  // 3. Standalone 4-digit number if context mentions code
  if (!otpCode && /code|pin|otp|verify/i.test(combined)) {
    const fourDigit = combined.match(/\b(\d{4})\b/);
    if (fourDigit) {
      otpCode = fourDigit[1];
    }
  }

  // 4. Verification link search
  let verificationLink: string | null = null;
  const linkMatch = combined.match(
    /https?:\/\/[^\s"'<>]+(?:verify|verification|confirm|activate|token=|code=)[^\s"'<>]+/i
  );
  if (linkMatch) {
    verificationLink = linkMatch[0].replace(/[.,;)]+$/, '');
  }

  return { otpCode, verificationLink };
}

/**
 * Create a new temporary inbox under the resolved domain
 */
export async function createTempInbox(params: {
  username?: string;
  domain: string;
  ttlSeconds?: number;
  ipHash?: string;
  previousAddress?: string;
  previousToken?: string;
}): Promise<TempInboxRecord> {
  const { domain, ipHash } = params;
  const ttl = Math.min(86400, Math.max(600, params.ttlSeconds || 3600)); // 10m to 24h

  // Clean previous inbox if replacing with a fresh address
  if (params.previousAddress) {
    try {
      await deleteTempInbox(params.previousAddress, params.previousToken);
    } catch {
      // non-blocking
    }
  }

  // Clean custom username or generate random 6-character alphanumeric slug
  let userSlug = (params.username || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-');

  if (params.username) {
    const isReserved = RESERVED_OFFICIAL_ALIASES.some(
      (a) => userSlug === a || userSlug.startsWith(`${a}_`) || userSlug.startsWith(`${a}-`)
    );
    if (isReserved) {
      throw new Error(
        `'${userSlug}' is an official domain address. Official aliases (hello, test, contact, support, reply, noreply) are locked and cannot be used for disposable temporary mail.`
      );
    }
  }

  if (!userSlug || userSlug.length < 3) {
    userSlug = `tmp_${Math.random().toString(36).substring(2, 8)}`;
  }

  const address = `${userSlug}@${domain}`.toLowerCase();
  const token = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();

  const inboxRecord: TempInboxRecord = {
    id: `inbox_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    address,
    username: userSlug,
    domain,
    token,
    ip_hash: ipHash,
    ttl_seconds: ttl,
    created_at: now.toISOString(),
    expires_at: expiresAt,
    is_active: true,
  };

  // 1. Try Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();

      // Local development IPs are NEVER rate-limited
      const isLocalDev =
        !ipHash ||
        ipHash === '127.0.0.1' ||
        ipHash === '::1' ||
        ipHash === 'localhost' ||
        ipHash.startsWith('192.168.') ||
        ipHash.startsWith('10.');

      // Auto-prune oldest active inboxes if IP has >= 10 active (instead of blocking user)
      if (ipHash && !isLocalDev) {
        const { data: activeList } = await supabase
          .from('os_temp_inboxes')
          .select('id, expires_at')
          .eq('ip_hash', ipHash)
          .gt('expires_at', now.toISOString())
          .order('created_at', { ascending: true });

        if (activeList && activeList.length >= 10) {
          const toDelete = activeList.slice(0, activeList.length - 9).map((i) => i.id);
          await supabase.from('os_temp_inboxes').delete().in('id', toDelete);
        }
      }

      const { error } = await supabase.from('os_temp_inboxes').insert({
        id: inboxRecord.id,
        address: inboxRecord.address,
        username: inboxRecord.username,
        domain: inboxRecord.domain,
        token: inboxRecord.token,
        ip_hash: inboxRecord.ip_hash,
        ttl_seconds: inboxRecord.ttl_seconds,
        created_at: inboxRecord.created_at,
        expires_at: inboxRecord.expires_at,
        is_active: true,
      });

      if (!error) {
        // Also sync to local file for offline resilience
        const store = await readLocalStore();
        store.inboxes.unshift(inboxRecord);
        await writeLocalStore(store);
        return inboxRecord;
      }
    } catch (err: unknown) {
      console.warn('Supabase createTempInbox fallback to local file:', err);
    }
  }

  // 2. Local fallback
  const store = await readLocalStore();
  const nowIso = now.toISOString();

  // Prune expired inboxes and deduplicate
  store.inboxes = store.inboxes.filter(
    (i) => i.expires_at > nowIso && i.address.toLowerCase() !== address
  );

  // If local store has accumulated >= 15 inboxes, keep only the latest 14
  if (store.inboxes.length >= 15) {
    store.inboxes = store.inboxes.slice(0, 14);
  }

  store.inboxes.unshift(inboxRecord);
  await writeLocalStore(store);

  return inboxRecord;
}

/**
 * Ingest incoming real email via Resend Inbound Webhook
 * Includes anti-flooding rate limits:
 * - Drops email if inbox is expired or does not exist
 * - Max 15 messages per temp inbox to prevent spam bombing
 */
export async function ingestInboundEmail(params: {
  resendId?: string;
  from: string | { email: string; name?: string };
  to: string | string[];
  subject?: string | null;
  text?: string | null;
  html?: string | null;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Normalize recipient addresses
  const recipientList: string[] = Array.isArray(params.to)
    ? params.to
    : typeof params.to === 'string'
    ? [params.to]
    : [];

  if (recipientList.length === 0) {
    return { success: false, error: 'Missing recipient email address' };
  }

  // Extract from details
  const fromEmail =
    typeof params.from === 'object' && params.from !== null
      ? params.from.email
      : String(params.from || 'unknown@domain.com');

  const fromName =
    typeof params.from === 'object' && params.from !== null && params.from.name
      ? params.from.name
      : fromEmail.split('@')[0];

  const subject = params.subject || '(No Subject)';
  const bodyText = params.text || '';
  const bodyHtml = params.html || '';
  const snippet = (bodyText || bodyHtml.replace(/<[^>]*>/g, ' '))
    .trim()
    .substring(0, 160)
    .replace(/\s+/g, ' ');

  const { otpCode, verificationLink } = extractOtpAndLink(subject, bodyText, bodyHtml);
  const now = new Date();

  // Find matching active temp inboxes
  for (const rawTo of recipientList) {
    const toClean = rawTo.toLowerCase().trim();
    const toUser = toClean.split('@')[0];

    // Official locked aliases belong to primary inbox only, never temp mail
    if (RESERVED_OFFICIAL_ALIASES.some((a) => toUser === a || toUser.startsWith(`${a}_`))) {
      continue;
    }

    // 1. Check Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        const { data: inbox } = await supabase
          .from('os_temp_inboxes')
          .select('*')
          .eq('address', toClean)
          .gt('expires_at', now.toISOString())
          .maybeSingle();

        if (inbox) {
          // Anti-flooding rate limit check: max 15 messages per temp address
          const { count } = await supabase
            .from('os_temp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('inbox_address', toClean);

          if (count && count >= 15) {
            console.warn(`[Temp Mail] Anti-flood triggered: Inbox ${toClean} reached limit of 15 emails.`);
            return { success: false, error: 'Inbox message capacity reached (anti-flood limit: 15)' };
          }

          const msgId = `tmpmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const { error: msgErr } = await supabase.from('os_temp_messages').insert({
            id: msgId,
            inbox_address: toClean,
            resend_id: params.resendId,
            from_name: fromName,
            from_email: fromEmail,
            to_email: toClean,
            subject,
            snippet,
            body_text: bodyText,
            body_html: bodyHtml,
            otp_code: otpCode,
            verification_link: verificationLink,
            is_read: false,
            received_at: now.toISOString(),
            expires_at: inbox.expires_at,
          });

          if (!msgErr) {
            return { success: true, messageId: msgId };
          }
        }
      } catch (err) {
        console.warn('Supabase ingestInboundEmail fallback:', err);
      }
    }

    // 2. Local fallback
    const store = await readLocalStore();
    const localInbox = store.inboxes.find(
      (i) =>
        (i.address.toLowerCase() === toClean || i.username.toLowerCase() === toUser) &&
        i.expires_at > now.toISOString()
    );

    if (localInbox) {
      const existingCount = store.messages.filter(
        (m) => m.inbox_address.toLowerCase() === toClean
      ).length;

      if (existingCount >= 15) {
        return { success: false, error: 'Inbox full (anti-flood limit: 15)' };
      }

      const msgRecord: TempMessageRecord = {
        id: `tmpmsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        inbox_address: toClean,
        resend_id: params.resendId,
        from_name: fromName,
        from_email: fromEmail,
        to_email: toClean,
        subject,
        snippet,
        body_text: bodyText,
        body_html: bodyHtml,
        otp_code: otpCode,
        verification_link: verificationLink,
        is_read: false,
        received_at: now.toISOString(),
        expires_at: localInbox.expires_at,
      };

      store.messages.unshift(msgRecord);
      await writeLocalStore(store);
      return { success: true, messageId: msgRecord.id };
    }
  }

  return { success: false, error: 'No matching active temporary inbox found' };
}

/**
 * Fetch received messages for an active inbox (validates token & expiration)
 */
export async function getTempInboxMessages(
  inboxAddress: string,
  token?: string
): Promise<{ inbox: TempInboxRecord | null; messages: TempMessageRecord[] }> {
  const cleanAddress = inboxAddress.toLowerCase().trim();
  const now = new Date().toISOString();

  // 1. Try Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data: inbox } = await supabase
        .from('os_temp_inboxes')
        .select('*')
        .eq('address', cleanAddress)
        .gt('expires_at', now)
        .maybeSingle();

      if (inbox) {
        // Enforce secret token verification: reading inbox messages strictly requires valid ownership token
        if (!token || !inbox.token || inbox.token !== token) {
          return { inbox: null, messages: [] };
        }

        const { data: msgs } = await supabase
          .from('os_temp_messages')
          .select('*')
          .eq('inbox_address', cleanAddress)
          .gt('expires_at', now)
          .order('received_at', { ascending: false });

        return {
          inbox: inbox as TempInboxRecord,
          messages: (msgs || []) as TempMessageRecord[],
        };
      }
    } catch (err) {
      console.warn('Supabase getTempInboxMessages fallback:', err);
    }
  }

  // 2. Local File Fallback
  const store = await readLocalStore();
  const localInbox = store.inboxes.find(
    (i) => i.address.toLowerCase() === cleanAddress && i.expires_at > now
  );

  if (!localInbox) {
    return { inbox: null, messages: [] };
  }

  // Local fallback: enforce secret token verification
  if (!token || !localInbox.token || localInbox.token !== token) {
    return { inbox: null, messages: [] };
  }

  const messages = store.messages
    .filter((m) => m.inbox_address.toLowerCase() === cleanAddress && m.expires_at > now)
    .sort((a, b) => b.received_at.localeCompare(a.received_at));

  return { inbox: localInbox, messages };
}

/**
 * Delete a temporary inbox and all its associated messages
 */
export async function deleteTempInbox(inboxAddress: string, token?: string): Promise<boolean> {
  const cleanAddress = inboxAddress.toLowerCase().trim();

  // 1. Try Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      let query = supabase.from('os_temp_inboxes').delete().eq('address', cleanAddress);
      if (token) {
        query = query.eq('token', token);
      }
      await query;
      await supabase.from('os_temp_messages').delete().eq('inbox_address', cleanAddress);
    } catch {
      // fallback
    }
  }

  // 2. Local Fallback
  const store = await readLocalStore();
  store.inboxes = store.inboxes.filter((i) => i.address.toLowerCase() !== cleanAddress);
  store.messages = store.messages.filter((m) => m.inbox_address.toLowerCase() !== cleanAddress);
  await writeLocalStore(store);

  return true;
}
