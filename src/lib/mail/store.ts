import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MailMessage, MailStoreData, EmailAttachment, MailThread, EmailAddress } from '@/types/mail';
import { supabaseServer } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { getAppSecret } from '@/lib/env-vault';

const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'inbox-store.json');

/**
 * Normalizes an email subject by stripping Re:, Fwd:, FW:, etc. case-insensitively and repeatedly.
 */
export function normalizeSubject(subject: string): string {
  if (!subject) return '';
  return subject
    .replace(/^(\s*(re|fwd|fw|re\s*\[\d+\]|fwd\s*\[\d+\])\s*:\s*)+/i, '')
    .trim();
}

/**
 * Resolves thread assignments for an array of messages using the 3-pass algorithm:
 * Pass 1: In-Reply-To / References linking
 * Pass 2: Normalized subject fallback ONLY if participants overlap AND messages are within 30 days
 * Pass 3: Self-assign threadId = id
 */
export function backfillThreads(messages: MailMessage[]): MailMessage[] {
  const result = messages.map((m) => ({ ...m }));
  const idMap = new Map<string, MailMessage>();
  const resendMap = new Map<string, MailMessage>();

  for (const m of result) {
    if (m.id) idMap.set(m.id, m);
    if (m.resendId) resendMap.set(m.resendId, m);
  }

  // Pass 1: In-Reply-To and References
  for (const m of result) {
    let parent: MailMessage | undefined;
    if (m.inReplyTo) {
      parent = resendMap.get(m.inReplyTo) || idMap.get(m.inReplyTo);
    }
    if (!parent && m.references) {
      for (const [resendId, candidate] of resendMap.entries()) {
        if (m.references.includes(resendId)) {
          parent = candidate;
          break;
        }
      }
    }
    if (parent) {
      const assigned = parent.threadId || parent.id;
      m.threadId = assigned;
      m.thread_id = assigned;
    }
  }

  // Pass 2: Normalized subject fallback ONLY if participants overlap AND within 30 days
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  for (let i = 0; i < result.length; i++) {
    const current = result[i];
    const norm = normalizeSubject(current.subject);
    if (!norm) continue;

    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      const other = result[j];
      const otherNorm = normalizeSubject(other.subject);
      if (norm.toLowerCase() !== otherNorm.toLowerCase()) continue;

      const currentParticipants = [current.from.email, ...(current.to || []).map((t) => t.email)]
        .filter(Boolean)
        .map((e) => e.toLowerCase());
      const otherParticipants = [other.from.email, ...(other.to || []).map((t) => t.email)]
        .filter(Boolean)
        .map((e) => e.toLowerCase());
      const hasOverlap = currentParticipants.some((p) => otherParticipants.includes(p));
      if (!hasOverlap) continue;

      const currentTime = new Date(current.createdAt).getTime();
      const otherTime = new Date(other.createdAt).getTime();
      if (Math.abs(currentTime - otherTime) <= thirtyDaysMs) {
        const targetThreadId =
          otherTime <= currentTime
            ? other.threadId || other.id
            : current.threadId || current.id;
        current.threadId = targetThreadId;
        current.thread_id = targetThreadId;
        other.threadId = targetThreadId;
        other.thread_id = targetThreadId;
      }
    }
  }

  // Pass 3: Self-assign
  for (const m of result) {
    if (!m.threadId) {
      m.threadId = m.id;
      m.thread_id = m.id;
    }
  }

  return result;
}

/**
 * Official locked business aliases for the domain.
 * Emails to these addresses are treated as important primary communications.
 * Disposable temporary mail is explicitly forbidden from claiming these addresses.
 */
export const OFFICIAL_ALIASES = [
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
] as const;

export function isOfficialEmail(m: MailMessage): boolean {
  if (m.tags?.includes('Temp Mail')) return false;
  if (m.direction === 'outbound' || m.folder === 'sent') {
    const user = m.from.email.split('@')[0]?.toLowerCase() || '';
    return OFFICIAL_ALIASES.some((a) => user === a || user.startsWith(a));
  }
  return (
    m.to?.some((t) => {
      const user = t.email.split('@')[0]?.toLowerCase() || '';
      if (!user || user.startsWith('tmp_') || user.startsWith('tmp-')) return false;
      return OFFICIAL_ALIASES.some((a) => user === a || user.startsWith(a));
    }) ?? false
  );
}

export function isTempEmail(m: MailMessage): boolean {
  if (m.tags?.includes('Temp Mail')) return true;
  return (
    m.to?.some((t) => {
      const user = t.email.split('@')[0]?.toLowerCase() || '';
      return user.startsWith('tmp_') || user.startsWith('tmp-');
    }) ?? false
  );
}


/**
 * Normalizes either a standard MailMessage or a relational Supabase/table-store row into a MailMessage.
 */
export function normalizeMessage(item: Record<string, unknown>): MailMessage {
  const rawFrom = item.from;
  const rawTo = item.to;

  const isStandardNested = rawFrom && typeof rawFrom === 'object' && item.folder;

  if (isStandardNested) {
    const fromObj = rawFrom as { name?: string; email?: string };
    const toArr = Array.isArray(rawTo) ? (rawTo as Array<{ name?: string; email?: string }>) : [];
    const isTrashed = Boolean(
      item.isTrashed || item.is_trashed || item.folder === 'trash' || item.status === 'trash'
    );
    const isArchived = Boolean(
      item.isArchived || item.is_archived || item.folder === 'archive' || item.status === 'archived' || item.label === 'archive'
    );

    let folder: 'inbox' | 'sent' | 'archive' | 'trash';
    if (isTrashed) {
      folder = 'trash';
    } else if (isArchived) {
      folder = 'archive';
    } else if (item.folder === 'sent' || item.direction === 'outbound') {
      folder = 'sent';
    } else {
      folder = 'inbox';
    }

    const threadId = (item.threadId || item.thread_id) ? String(item.threadId || item.thread_id) : undefined;
    const readAt = (item.readAt || item.read_at) ? String(item.readAt || item.read_at) : undefined;

    return {
      id: String(item.id || `msg_${Date.now()}`),
      threadId: threadId || String(item.id || ''),
      thread_id: threadId || String(item.id || ''),
      resendId: (item.resendId || item.resend_id) as string | undefined,
      resend_id: (item.resendId || item.resend_id) as string | undefined,
      folder,
      from: {
        name: fromObj?.name || 'Sender',
        email: fromObj?.email || '',
      },
      to:
        toArr.length > 0
          ? toArr.map((t) => ({ name: t.name || 'Recipient', email: t.email || '' }))
          : [{ name: 'Md Zahid Hasan', email: 'hello@zahidp.com' }],
      replyTo: (item.replyTo as string) || (item.reply_to as string) || fromObj?.email,
      subject: String(item.subject || '(No Subject)'),
      body: String(item.body || item.textBody || item.text_body || ''),
      textBody: (item.textBody || item.text_body || item.body) as string | undefined,
      htmlBody: (item.htmlBody || item.html_body) as string | undefined,
      snippet: String(
        item.snippet ||
          (item.textBody || item.text_body || item.body
            ? String(item.textBody || item.text_body || item.body).substring(0, 120)
            : '')
      ),
      createdAt: String(item.createdAt || item.created_at || item.received_at || new Date().toISOString()),
      receivedAt: (item.receivedAt || item.received_at) as string | undefined,
      isRead: Boolean(item.isRead ?? (item.status === 'read')),
      readAt,
      read_at: readAt,
      isStarred: Boolean(item.isStarred ?? item.is_starred),
      isTrashed,
      isArchived,
      label: (item.label as string) || 'inbox',
      direction: (item.direction as 'inbound' | 'outbound') || (folder === 'sent' ? 'outbound' : 'inbound'),
      inReplyTo: (item.inReplyTo || item.in_reply_to) as string | undefined,
      references: (item.references || item.references_header) as string | undefined,
      attachments: Array.isArray(item.attachments) ? (item.attachments as EmailAttachment[]) : [],
      headers: (item.headers || item.raw_headers) as Record<string, string> | undefined,
      tags: Array.isArray(item.tags)
        ? (item.tags as string[])
        : (item.direction === 'outbound' || folder === 'sent' ? ['Outbound'] : ['Inquiry']),
    };
  }

  // Relational table format (Supabase inbox_messages table row or CSV row)
  const isSent = Boolean(item.is_sent || item.direction === 'outbound' || item.folder === 'sent');
  const isTrashed = Boolean(item.is_trashed || item.folder === 'trash' || item.status === 'trash');
  const isArchived = Boolean(
    item.is_archived || item.folder === 'archive' || item.status === 'archived' || item.label === 'archive'
  );

  let folder: 'inbox' | 'sent' | 'archive' | 'trash';
  if (isTrashed) {
    folder = 'trash';
  } else if (isArchived) {
    folder = 'archive';
  } else if (isSent) {
    folder = 'sent';
  } else {
    folder = 'inbox';
  }

  const fromEmail = String(item.from_email || item.email || (isSent ? 'hello@zahidp.com' : 'guest@example.com'));
  const fromName = String(item.from_name || item.name || (isSent ? 'Md Zahid Hasan' : fromEmail.split('@')[0]));
  const toEmail = String(item.to_email || item.recipient || (isSent ? item.email || '' : 'hello@zahidp.com'));
  const toName = isSent ? 'Recipient' : 'Md Zahid Hasan';

  const textContent = String(item.text_body || item.body || '');
  const htmlContent = item.html_body ? String(item.html_body) : undefined;
  const snippet = textContent
    ? textContent.replace(/[\r\n\t]+/g, ' ').substring(0, 120)
    : htmlContent
    ? htmlContent.replace(/<[^>]+>/g, ' ').substring(0, 120)
    : '';

  const isRead =
    item.is_read !== undefined && item.is_read !== null
      ? Boolean(item.is_read)
      : item.status !== 'unread';

  const relThreadId = (item.thread_id || item.threadId) ? String(item.thread_id || item.threadId) : undefined;
  const relReadAt = (item.read_at || item.readAt) ? String(item.read_at || item.readAt) : undefined;

  return {
    id: String(item.id || `msg_${Date.now()}`),
    threadId: relThreadId || String(item.id || ''),
    thread_id: relThreadId || String(item.id || ''),
    resendId: (item.resend_id || item.resendId) as string | undefined,
    resend_id: (item.resend_id || item.resendId) as string | undefined,
    folder,
    from: { name: fromName, email: fromEmail },
    to: [{ name: toName, email: toEmail }],
    replyTo: (item.replyTo as string) || (item.reply_to as string) || fromEmail,
    subject: String(item.subject || '(No Subject)'),
    body: textContent,
    textBody: textContent || undefined,
    htmlBody: htmlContent,
    snippet,
    createdAt: String(item.received_at || item.created_at || item.createdAt || new Date().toISOString()),
    receivedAt: (item.received_at || item.receivedAt) as string | undefined,
    isRead,
    readAt: relReadAt,
    read_at: relReadAt,
    isStarred: Boolean(item.is_starred ?? item.isStarred),
    isTrashed,
    isArchived,
    label: (item.label as string) || (folder === 'archive' ? 'archive' : 'inbox'),
    direction: (item.direction as 'inbound' | 'outbound') || (isSent ? 'outbound' : 'inbound'),
    inReplyTo: (item.in_reply_to || item.inReplyTo) as string | undefined,
    references: (item.references_header || item.references) as string | undefined,
    attachments: Array.isArray(item.attachments) ? (item.attachments as EmailAttachment[]) : [],
    headers: (item.raw_headers || item.headers) as Record<string, string> | undefined,
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : (isSent ? ['Outbound'] : ['Inquiry']),
  };
}

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 4000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase query timed out')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function readMailStore(): Promise<MailStoreData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase relational table first (newest first)
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await withTimeout(
        supabase
          .from('inbox_messages')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (error) {
        throw new Error(`Failed to read inbox messages: ${error.message}`);
      }

      if (Array.isArray(data)) {
        return {
          updatedAt: new Date().toISOString(),
          messages: data.map((d) => normalizeMessage(d as Record<string, unknown>)),
        };
      }
    } catch (err) {
      if (process.env.VERCEL || supabaseUrl) {
        throw err;
      }
    }
  }

  // 2. Read local JSON store file (offline local dev without Supabase only)
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);

    let rawList: Record<string, unknown>[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && Array.isArray(parsed.messages)) {
      rawList = parsed.messages;
    }

    const messages = rawList.map((item) => normalizeMessage(item));

    return {
      updatedAt: (parsed && !Array.isArray(parsed) && parsed.updatedAt) || new Date().toISOString(),
      messages,
    };
  } catch {
    return {
      updatedAt: new Date().toISOString(),
      messages: [],
    };
  }
}

export async function writeMailStore(data: MailStoreData): Promise<boolean> {
  let fileSaved = false;
  let supabaseSaved = false;

  data.updatedAt = new Date().toISOString();
  if (!Array.isArray(data.messages)) {
    data.messages = [];
  }

  data.messages = data.messages.map((m) => normalizeMessage(m as unknown as Record<string, unknown>));

  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      fileSaved = true;
    } catch (err) {
      console.warn('[MailStore] Failed to write local mail store:', err);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.from('site_settings').upsert(
        {
          key: 'inbox_store',
          value: data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
      if (!error) {
        supabaseSaved = true;
      } else {
        console.warn('[MailStore] Supabase site_settings error in writeMailStore:', error.message);
      }
    } catch (err) {
      console.warn('[MailStore] Supabase write error:', err);
    }
  }

  if (!fileSaved && !supabaseSaved) {
    throw new Error('Failed to save mail store to storage');
  }

  return true;
}

export function filterMailMessages(
  allMsgs: MailMessage[],
  filter?: {
    folder?: string;
    search?: string;
    isStarred?: boolean;
    alias?: string;
    category?: 'official' | 'temp' | 'all';
  }
): MailMessage[] {
  let msgs = allMsgs || [];

  if (filter?.folder) {
    if (filter.folder === 'starred') {
      msgs = msgs.filter((m) => m.isStarred && !m.isTrashed && m.folder !== 'trash');
    } else if (filter.folder === 'trash') {
      msgs = msgs.filter((m) => m.isTrashed || m.folder === 'trash');
    } else if (filter.folder === 'archive') {
      msgs = msgs.filter((m) => (m.folder === 'archive' || m.isArchived) && !m.isTrashed && m.folder !== 'trash');
    } else if (filter.folder === 'sent') {
      msgs = msgs.filter(
        (m) =>
          (m.direction === 'outbound' || m.folder === 'sent') &&
          !m.isTrashed &&
          !m.isArchived
      );
    } else {
      // 'inbox'
      msgs = msgs.filter(
        (m) =>
          (m.folder === 'inbox' || !m.folder) &&
          m.direction !== 'outbound' &&
          !m.isTrashed &&
          !m.isArchived
      );
    }
  }

  // Lock to official mail vs temp mail
  // Default for inbox is 'official' unless explicitly asked for 'all' or 'temp'
  const cat = filter?.category || (filter?.folder === 'inbox' ? 'official' : 'all');
  if (cat === 'official') {
    msgs = msgs.filter((m) => !isTempEmail(m));
  } else if (cat === 'temp') {
    msgs = msgs.filter((m) => isTempEmail(m));
  }

  // Filter by alias (e.g. test@zahidp.com or hello@zahidp.com)
  if (filter?.alias && filter.alias !== 'all') {
    const aliasLower = filter.alias.toLowerCase().trim();
    msgs = msgs.filter((m) => {
      const recipientMatch = m.to?.some((t) => t.email.toLowerCase().includes(aliasLower));
      const senderMatch = m.direction === 'outbound' && m.from.email.toLowerCase().includes(aliasLower);
      return recipientMatch || senderMatch;
    });
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    msgs = msgs.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.from.name.toLowerCase().includes(q) ||
        m.from.email.toLowerCase().includes(q) ||
        m.to?.some((t) => t.email.toLowerCase().includes(q)) ||
        m.snippet.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
    );
  }

  // Sort descending by date (newest first)
  return msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function calculateUnreadCount(msgs: MailMessage[]): number {
  const unreadThreads = new Set<string>();
  const threaded = backfillThreads(msgs || []);
  for (const m of threaded) {
    if (
      !m.isRead &&
      !m.isTrashed &&
      !m.isArchived &&
      (m.folder === 'inbox' || (!m.folder && m.direction === 'inbound'))
    ) {
      unreadThreads.add(m.threadId || m.id);
    }
  }
  return unreadThreads.size;
}

export function groupMessagesIntoThreads(
  messages: MailMessage[],
  filter?: {
    folder?: string;
    search?: string;
    isStarred?: boolean;
    alias?: string;
    category?: 'official' | 'temp' | 'all';
  }
): MailThread[] {
  const threaded = backfillThreads(messages || []);
  const threadMap = new Map<string, MailMessage[]>();

  for (const m of threaded) {
    const tid = m.threadId || m.id;
    if (!threadMap.has(tid)) {
      threadMap.set(tid, []);
    }
    threadMap.get(tid)!.push(m);
  }

  const allThreads: MailThread[] = [];

  for (const [threadId, msgs] of threadMap.entries()) {
    msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const rootMessage = msgs[0];
    const latestMessage = msgs[msgs.length - 1];

    const participantMap = new Map<string, EmailAddress>();
    for (const m of msgs) {
      if (m.from?.email) participantMap.set(m.from.email.toLowerCase(), m.from);
      for (const t of m.to || []) {
        if (t?.email) participantMap.set(t.email.toLowerCase(), t);
      }
    }

    const hasUnread = msgs.some(
      (m) =>
        !m.isRead &&
        !m.isTrashed &&
        !m.isArchived &&
        (m.folder === 'inbox' || (!m.folder && m.direction === 'inbound'))
    );
    const isStarred = msgs.some((m) => m.isStarred && !m.isTrashed);
    const isTrashed = msgs.every((m) => m.isTrashed || m.folder === 'trash');
    const isArchived = msgs.every((m) => m.isArchived || m.folder === 'archive');
    const hasSent = msgs.some((m) => m.direction === 'outbound' || m.folder === 'sent');
    const hasInbound = msgs.some((m) => m.direction === 'inbound' || m.folder === 'inbox');

    const allTags = Array.from(new Set(msgs.flatMap((m) => m.tags || [])));

    allThreads.push({
      id: threadId,
      subject: rootMessage.subject || latestMessage.subject || '(No Subject)',
      normalizedSubject: normalizeSubject(rootMessage.subject || latestMessage.subject),
      snippet: latestMessage.snippet || latestMessage.body || '',
      lastMessageAt: latestMessage.createdAt,
      firstMessageAt: rootMessage.createdAt,
      participants: Array.from(participantMap.values()),
      messageCount: msgs.length,
      hasUnread,
      isStarred,
      isArchived,
      isTrashed,
      hasSent,
      hasInbound,
      tags: allTags,
      messages: msgs,
    });
  }

  let filtered = allThreads;

  if (filter?.folder) {
    if (filter.folder === 'starred') {
      filtered = filtered.filter((t) => t.isStarred && !t.isTrashed);
    } else if (filter.folder === 'trash') {
      filtered = filtered.filter(
        (t) => t.isTrashed || t.messages.some((m) => m.isTrashed || m.folder === 'trash')
      );
    } else if (filter.folder === 'archive') {
      filtered = filtered.filter(
        (t) =>
          (t.isArchived || t.messages.some((m) => m.isArchived || m.folder === 'archive')) &&
          !t.isTrashed
      );
    } else if (filter.folder === 'sent') {
      filtered = filtered.filter((t) => t.hasSent && !t.isTrashed && !t.isArchived);
    } else {
      // 'inbox'
      filtered = filtered.filter(
        (t) =>
          !t.isTrashed &&
          !t.isArchived &&
          t.messages.some((m) => m.folder === 'inbox' || (!m.folder && m.direction === 'inbound'))
      );
    }
  }

  const cat = filter?.category || (filter?.folder === 'inbox' ? 'official' : 'all');
  if (cat === 'official') {
    filtered = filtered.filter((t) => t.messages.some((m) => isOfficialEmail(m)));
  } else if (cat === 'temp') {
    filtered = filtered.filter((t) => t.messages.some((m) => isTempEmail(m)));
  }

  if (filter?.alias && filter.alias !== 'all') {
    const aliasLower = filter.alias.toLowerCase().trim();
    filtered = filtered.filter((t) =>
      t.participants.some((p) => p.email.toLowerCase().includes(aliasLower))
    );
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q) ||
        t.participants.some(
          (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
        ) ||
        t.messages.some((m) => m.body.toLowerCase().includes(q))
    );
  }

  return filtered.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function calculateMailFolderCounts(
  msgs: MailMessage[],
  filterCategory?: 'official' | 'temp' | 'all'
): {
  inbox: number;
  unread: number;
  sent: number;
  starred: number;
  archive: number;
  trash: number;
  official: number;
  temp: number;
} {
  const threads = groupMessagesIntoThreads(msgs || []);
  let inbox = 0;
  let unread = 0;
  let sent = 0;
  let starred = 0;
  let archive = 0;
  let trash = 0;
  let official = 0;
  let temp = 0;

  for (const t of threads) {
    const isTemp = t.messages.some((m) => isTempEmail(m));
    if (isTemp) temp++;
    else official++;

    if (t.isTrashed || t.messages.some((m) => m.isTrashed || m.folder === 'trash')) {
      trash++;
    } else if (t.isArchived || t.messages.every((m) => m.isArchived || m.folder === 'archive')) {
      archive++;
    } else {
      if (t.hasSent) sent++;
      if (
        t.messages.some((m) => m.folder === 'inbox' || (!m.folder && m.direction === 'inbound'))
      ) {
        if (filterCategory === 'temp') {
          if (isTemp) {
            inbox++;
            if (t.hasUnread) unread++;
          }
        } else if (filterCategory === 'official') {
          if (!isTemp) {
            inbox++;
            if (t.hasUnread) unread++;
          }
        } else {
          inbox++;
          if (t.hasUnread) unread++;
        }
      }
    }

    if (t.isStarred && !t.isTrashed) {
      starred++;
    }
  }

  return { inbox, unread, sent, starred, archive, trash, official, temp };
}

export async function listMailMessages(filter?: {
  folder?: string;
  search?: string;
  isStarred?: boolean;
  alias?: string;
  category?: 'official' | 'temp' | 'all';
}): Promise<MailMessage[]> {
  const store = await readMailStore();
  return filterMailMessages(store.messages || [], filter);
}

export async function listMailThreads(filter?: {
  folder?: string;
  search?: string;
  isStarred?: boolean;
  alias?: string;
  category?: 'official' | 'temp' | 'all';
}): Promise<MailThread[]> {
  const store = await readMailStore();
  return groupMessagesIntoThreads(store.messages || [], filter);
}

export async function getUnreadCount(): Promise<number> {
  return getUnreadThreadCount();
}

export async function getUnreadThreadCount(): Promise<number> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await withTimeout(
        supabase
          .from('inbox_messages')
          .select('thread_id')
          .eq('is_read', false)
          .eq('is_trashed', false)
          .neq('status', 'archived')
          .neq('status', 'trash')
          .eq('direction', 'inbound')
      );

      if (!error && Array.isArray(data)) {
        const uniqueThreads = new Set(data.map((r) => r.thread_id).filter(Boolean));
        return uniqueThreads.size;
      }
    } catch (err) {
      console.warn('[MailStore] Supabase unread count error:', err);
    }
  }

  const store = await readMailStore();
  return calculateUnreadCount(store.messages || []);
}

export async function getMailFolderCounts(filterCategory?: 'official' | 'temp' | 'all'): Promise<{
  inbox: number;
  unread: number;
  sent: number;
  starred: number;
  archive: number;
  trash: number;
  official: number;
  temp: number;
}> {
  const store = await readMailStore();
  return calculateMailFolderCounts(store.messages || [], filterCategory);
}

export async function addMailMessage(message: MailMessage): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const targetRecipient = message.to?.[0]?.email || 'hello@zahidp.com';
      await supabase.from('inbox_messages').insert({
        id: message.id,
        name: message.from.name,
        email: message.from.email,
        recipient: targetRecipient,
        subject: message.subject,
        body: message.body || message.textBody || '',
        status: message.isRead ? 'read' : 'unread',
        is_starred: message.isStarred || false,
        is_sent: message.folder === 'sent',
        created_at: message.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[MailStore] Supabase insert error in addMailMessage:', err);
    }
  }

  const store = await readMailStore();
  const normalized = normalizeMessage(message as unknown as Record<string, unknown>);
  store.messages.unshift(normalized);
  return writeMailStore(store);
}

/**
 * Ingest / Upsert a received email from Resend (used by both webhook and backfill)
 */
export async function upsertReceivedEmail(email: {
  id: string;
  from: string;
  to: string[] | string;
  subject?: string | null;
  html?: string | null;
  text?: string | null;
  created_at?: string;
  headers?: Record<string, unknown>;
  attachments?: EmailAttachment[];
}): Promise<MailMessage> {
  // Extract clean sender name and email
  let fromName = '';
  let fromEmail = email.from || '';
  const headerFrom = email.headers?.from;
  if (typeof headerFrom === 'string') {
    const match = headerFrom.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
    if (match) {
      fromName = match[1] ? match[1].trim() : '';
      fromEmail = match[2] ? match[2].trim() : email.from;
    }
  }
  if (!fromName) {
    fromName = fromEmail.split('@')[0] || 'Sender';
  }

  const toList = Array.isArray(email.to) ? email.to : [email.to || 'hello@zahidp.com'];
  const toEmail = toList.join(', ');
  const subject = email.subject || '(No Subject)';
  const textBody = email.text || (email.html ? email.html.replace(/<[^>]+>/g, ' ') : '');
  const htmlBody = email.html || '';
  const receivedAt = email.created_at || new Date().toISOString();
  const inReplyTo = (email.headers?.['in-reply-to'] as string) || '';
  const referencesHeader = (email.headers?.references as string) || '';

  const id = `msg_resend_${email.id}`;

  const store = await readMailStore();

  // Resolve Thread ID using our 3-pass criteria
  let resolvedThreadId: string | undefined;
  if (inReplyTo || referencesHeader) {
    const candidate = store.messages.find(
      (m) =>
        (inReplyTo && (m.resendId === inReplyTo || m.id === inReplyTo)) ||
        (referencesHeader && m.resendId && referencesHeader.includes(m.resendId))
    );
    if (candidate) {
      resolvedThreadId = candidate.threadId || candidate.id;
    }
  }

  if (!resolvedThreadId) {
    const norm = normalizeSubject(subject);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const currentParticipants = [fromEmail, ...toList].map((e) => e.toLowerCase().trim());

    const candidate = store.messages.find((m) => {
      if (normalizeSubject(m.subject).toLowerCase() !== norm.toLowerCase()) return false;
      const mParticipants = [m.from.email, ...(m.to || []).map((t) => t.email)].map((e) =>
        e.toLowerCase().trim()
      );
      const hasOverlap = currentParticipants.some((p) => mParticipants.includes(p));
      if (!hasOverlap) return false;
      const timeDiff = Math.abs(new Date(receivedAt).getTime() - new Date(m.createdAt).getTime());
      return timeDiff <= thirtyDaysMs;
    });

    if (candidate) {
      resolvedThreadId = candidate.threadId || candidate.id;
    }
  }

  if (!resolvedThreadId) {
    resolvedThreadId = id;
  }

  const richRow = {
    id,
    thread_id: resolvedThreadId,
    resend_id: email.id,
    from_name: fromName,
    from_email: fromEmail,
    to_email: toEmail,
    subject,
    text_body: textBody,
    html_body: htmlBody,
    received_at: receivedAt,
    is_read: false,
    read_at: null,
    is_starred: false,
    is_trashed: false,
    label: 'inbox',
    direction: 'inbound',
    in_reply_to: inReplyTo,
    references_header: referencesHeader,
    raw_headers: email.headers || {},
    attachments: email.attachments || [],
    // Legacy / base column fallbacks
    name: fromName,
    email: fromEmail,
    recipient: toEmail,
    body: textBody || htmlBody || '',
    status: 'unread',
    is_sent: false,
    created_at: receivedAt,
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      // DB-level deduplication: upsert with ON CONFLICT (resend_id) DO NOTHING
      const { error: upsertErr } = await supabase
        .from('inbox_messages')
        .upsert(richRow, { onConflict: 'resend_id', ignoreDuplicates: true });

      if (upsertErr) {
        console.warn('[MailStore] Supabase upsert error for received email:', upsertErr.message);
      }
    } catch (err) {
      console.warn('[MailStore] Supabase upsert exception for received email:', err);
    }
  }

  // Also update local store
  const normalized = normalizeMessage(richRow);
  const existingIdx = store.messages.findIndex((m) => m.resendId === email.id || m.id === id);
  if (existingIdx >= 0) {
    store.messages[existingIdx] = {
      ...normalized,
      threadId: store.messages[existingIdx].threadId || resolvedThreadId,
      thread_id: store.messages[existingIdx].thread_id || resolvedThreadId,
      isRead: store.messages[existingIdx].isRead,
      readAt: store.messages[existingIdx].readAt,
      isStarred: store.messages[existingIdx].isStarred,
      isTrashed: store.messages[existingIdx].isTrashed,
      isArchived: store.messages[existingIdx].isArchived,
      folder: store.messages[existingIdx].folder,
    };
  } else {
    store.messages.unshift(normalized);
  }
  await writeMailStore(store);

  return normalized;
}

/**
 * Save an outbound sent reply to Supabase and local store
 */
export async function saveSentMessage(sent: {
  id: string;
  threadId?: string;
  resendId?: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  text: string;
  html?: string;
  inReplyTo?: string;
  references?: string;
}): Promise<MailMessage> {
  const createdAt = new Date().toISOString();
  const store = await readMailStore();

  let resolvedThreadId = sent.threadId;
  if (!resolvedThreadId && (sent.inReplyTo || sent.references)) {
    const candidate = store.messages.find(
      (m) =>
        (sent.inReplyTo && (m.resendId === sent.inReplyTo || m.id === sent.inReplyTo)) ||
        (sent.references && m.resendId && sent.references.includes(m.resendId))
    );
    if (candidate) {
      resolvedThreadId = candidate.threadId || candidate.id;
    }
  }

  if (!resolvedThreadId) {
    const norm = normalizeSubject(sent.subject);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const currentParticipants = [sent.fromEmail, sent.toEmail].map((e) => e.toLowerCase().trim());

    const candidate = store.messages.find((m) => {
      if (normalizeSubject(m.subject).toLowerCase() !== norm.toLowerCase()) return false;
      const mParticipants = [m.from.email, ...(m.to || []).map((t) => t.email)].map((e) =>
        e.toLowerCase().trim()
      );
      const hasOverlap = currentParticipants.some((p) => mParticipants.includes(p));
      if (!hasOverlap) return false;
      const timeDiff = Math.abs(new Date(createdAt).getTime() - new Date(m.createdAt).getTime());
      return timeDiff <= thirtyDaysMs;
    });

    if (candidate) {
      resolvedThreadId = candidate.threadId || candidate.id;
    }
  }

  if (!resolvedThreadId) {
    resolvedThreadId = sent.id;
  }

  const richRow = {
    id: sent.id,
    thread_id: resolvedThreadId,
    resend_id: sent.resendId || null,
    from_name: sent.fromName,
    from_email: sent.fromEmail,
    to_email: sent.toEmail,
    subject: sent.subject,
    text_body: sent.text,
    html_body: sent.html || '',
    received_at: createdAt,
    is_read: true,
    read_at: createdAt,
    is_starred: false,
    is_trashed: false,
    label: 'sent',
    direction: 'outbound',
    in_reply_to: sent.inReplyTo || '',
    references_header: sent.references || '',
    raw_headers: {},
    attachments: [],
    // Legacy fallbacks
    name: sent.fromName,
    email: sent.fromEmail,
    recipient: sent.toEmail,
    body: sent.text,
    status: 'read',
    is_sent: true,
    created_at: createdAt,
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error: insertErr } = await supabase.from('inbox_messages').insert(richRow);
      if (insertErr && insertErr.message?.includes('column')) {
        await supabase.from('inbox_messages').insert({
          id: sent.id,
          name: sent.fromName,
          email: sent.fromEmail,
          recipient: sent.toEmail,
          subject: sent.subject,
          body: sent.text,
          status: 'read',
          is_starred: false,
          is_sent: true,
          created_at: createdAt,
        });
      }
    } catch (err) {
      console.warn('[MailStore] Supabase save sent message error:', err);
    }
  }

  const normalized = normalizeMessage(richRow);
  store.messages.unshift(normalized);
  await writeMailStore(store);

  return normalized;
}

export async function updateThreadReadState(threadId: string, isRead: boolean): Promise<boolean> {
  const store = await readMailStore();
  const now = new Date().toISOString();
  let anyUpdated = false;

  for (const m of store.messages) {
    if ((m.threadId === threadId || m.id === threadId) && m.direction === 'inbound') {
      m.isRead = isRead;
      m.readAt = isRead ? (m.readAt || now) : undefined;
      m.read_at = isRead ? (m.read_at || now) : undefined;
      anyUpdated = true;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const patch: Record<string, unknown> = {
        is_read: isRead,
        status: isRead ? 'read' : 'unread',
        read_at: isRead ? now : null,
      };
      await supabase
        .from('inbox_messages')
        .update(patch)
        .or(`thread_id.eq.${threadId},id.eq.${threadId}`);
    } catch (err) {
      console.warn('[MailStore] Supabase update thread read state error:', err);
    }
  }

  if (anyUpdated) {
    await writeMailStore(store);
  }
  return true;
}

export async function updateThreadFolder(
  threadId: string,
  folder: 'inbox' | 'archive' | 'trash' | 'sent'
): Promise<boolean> {
  const store = await readMailStore();
  const isTrashed = folder === 'trash';
  const isArchived = folder === 'archive';

  for (const m of store.messages) {
    if (m.threadId === threadId || m.id === threadId) {
      m.folder = folder;
      m.isTrashed = isTrashed;
      m.isArchived = isArchived;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const statusValue = isTrashed ? 'trash' : isArchived ? 'archived' : 'read';
      const labelValue = isArchived ? 'archive' : isTrashed ? 'trash' : folder === 'sent' ? 'sent' : 'inbox';
      await supabase
        .from('inbox_messages')
        .update({
          is_trashed: isTrashed,
          status: statusValue,
          label: labelValue,
        })
        .or(`thread_id.eq.${threadId},id.eq.${threadId}`);
    } catch (err) {
      console.warn('[MailStore] Supabase update thread folder error:', err);
    }
  }

  return writeMailStore(store);
}

export async function updateThreadStar(threadId: string, isStarred: boolean): Promise<boolean> {
  const store = await readMailStore();
  for (const m of store.messages) {
    if (m.threadId === threadId || m.id === threadId) {
      m.isStarred = isStarred;
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      await supabase
        .from('inbox_messages')
        .update({ is_starred: isStarred })
        .or(`thread_id.eq.${threadId},id.eq.${threadId}`);
    } catch (err) {
      console.warn('[MailStore] Supabase update thread star error:', err);
    }
  }

  return writeMailStore(store);
}

export async function deleteThread(threadId: string, permanent = false): Promise<boolean> {
  const store = await readMailStore();
  const threadMsgs = store.messages.filter((m) => m.threadId === threadId || m.id === threadId);
  if (threadMsgs.length === 0) return false;

  const isAlreadyTrash = threadMsgs.every((m) => m.isTrashed || m.folder === 'trash');
  const shouldPermanentlyDelete = permanent || isAlreadyTrash;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (shouldPermanentlyDelete) {
    store.messages = store.messages.filter((m) => m.threadId !== threadId && m.id !== threadId);
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        await supabase
          .from('inbox_messages')
          .delete()
          .or(`thread_id.eq.${threadId},id.eq.${threadId}`);
      } catch (err) {
        console.warn('[MailStore] Supabase permanent delete thread error:', err);
      }
    }
  } else {
    for (const m of store.messages) {
      if (m.threadId === threadId || m.id === threadId) {
        m.isTrashed = true;
        m.isArchived = false;
        m.folder = 'trash';
      }
    }
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        await supabase
          .from('inbox_messages')
          .update({ is_trashed: true, status: 'trash', label: 'trash' })
          .or(`thread_id.eq.${threadId},id.eq.${threadId}`);
      } catch (err) {
        console.warn('[MailStore] Supabase trash thread error:', err);
      }
    }
  }

  return writeMailStore(store);
}

export async function updateMailMessage(
  id: string,
  updates: Partial<MailMessage>
): Promise<MailMessage | null> {
  const store = await readMailStore();
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx < 0) return null;

  const prev = store.messages[idx];
  const updated: MailMessage = {
    ...prev,
    ...updates,
  };

  if (updates.folder) {
    updated.isTrashed = updates.folder === 'trash';
    updated.isArchived = updates.folder === 'archive';
  }
  if (typeof updates.isTrashed === 'boolean') {
    updated.folder = updates.isTrashed ? 'trash' : 'inbox';
  }
  if (typeof updates.isArchived === 'boolean') {
    updated.folder = updates.isArchived ? 'archive' : 'inbox';
  }

  store.messages[idx] = updated;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const patch: Record<string, unknown> = {};

      if (typeof updates.isRead === 'boolean') {
        patch.is_read = updates.isRead;
        patch.status = updates.isRead ? 'read' : 'unread';
      }
      if (typeof updates.isStarred === 'boolean') {
        patch.is_starred = updates.isStarred;
      }
      if (typeof updates.isTrashed === 'boolean') {
        patch.is_trashed = updates.isTrashed;
        if (updates.isTrashed) {
          patch.status = 'trash';
          patch.label = 'trash';
        }
      }
      if (typeof updates.isArchived === 'boolean') {
        if (updates.isArchived) {
          patch.status = 'archived';
          patch.label = 'archive';
        }
      }

      if (updates.folder === 'trash') {
        patch.is_trashed = true;
        patch.status = 'trash';
        patch.label = 'trash';
      } else if (updates.folder === 'archive') {
        patch.is_trashed = false;
        patch.status = 'archived';
        patch.label = 'archive';
      } else if (updates.folder === 'inbox') {
        patch.is_trashed = false;
        patch.status = updated.isRead ? 'read' : 'unread';
        patch.direction = 'inbound';
        patch.label = 'inbox';
      } else if (updates.folder === 'sent') {
        patch.is_trashed = false;
        patch.status = 'read';
        patch.direction = 'outbound';
        patch.label = 'sent';
        patch.is_sent = true;
      }

      const { error } = await supabase.from('inbox_messages').update(patch).eq('id', id);
      if (error && error.message?.includes('column')) {
        const fallbackPatch: Record<string, unknown> = {};
        if (patch.status) fallbackPatch.status = patch.status;
        if (typeof patch.is_starred === 'boolean') fallbackPatch.is_starred = patch.is_starred;
        await supabase.from('inbox_messages').update(fallbackPatch).eq('id', id);
      }
    } catch (err) {
      console.warn('[MailStore] Supabase update error:', err);
    }
  }

  await writeMailStore(store);
  return updated;
}

export async function deleteMailMessage(id: string, permanent: boolean = false): Promise<boolean> {
  const store = await readMailStore();
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx < 0) return false;

  const msg = store.messages[idx];
  const isAlreadyTrash = msg.isTrashed || msg.folder === 'trash';
  const shouldPermanentlyDelete = permanent || isAlreadyTrash;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (shouldPermanentlyDelete) {
    store.messages.splice(idx, 1);
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        await supabase.from('inbox_messages').delete().eq('id', id);
      } catch (err) {
        console.warn('[MailStore] Supabase permanent delete error:', err);
      }
    }
  } else {
    store.messages[idx].isTrashed = true;
    store.messages[idx].isArchived = false;
    store.messages[idx].folder = 'trash';
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        await supabase
          .from('inbox_messages')
          .update({ is_trashed: true, status: 'trash', label: 'trash' })
          .eq('id', id);
      } catch (err) {
        console.warn('[MailStore] Supabase trash error:', err);
      }
    }
  }

  return writeMailStore(store);
}

export async function emptyTrash(): Promise<number> {
  const store = await readMailStore();
  const trashIds = store.messages.filter((m) => m.isTrashed || m.folder === 'trash').map((m) => m.id);
  const originalLength = store.messages.length;
  store.messages = store.messages.filter((m) => !m.isTrashed && m.folder !== 'trash');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      if (trashIds.length > 0) {
        await supabase.from('inbox_messages').delete().in('id', trashIds);
      }
      await supabase.from('inbox_messages').delete().eq('status', 'trash');
    } catch (err) {
      console.warn('[MailStore] Supabase empty trash error:', err);
    }
  }

  await writeMailStore(store);
  return originalLength - store.messages.length;
}


let lastResendSyncTime = 0;

/**
 * Automatically synchronize incoming emails from Resend Receiving API.
 * Compares against already ingested email IDs, imports any newly arrived emails,
 * and delivers temporary mails to the Zahid OS Temp Mail subsystem.
 */
export async function syncReceivedEmailsFromResend(force = false): Promise<{ count: number; newEmails: string[] }> {
  const now = Date.now();
  // Throttle to at most once every 10 seconds unless force=true
  if (!force && now - lastResendSyncTime < 10000) {
    return { count: 0, newEmails: [] };
  }
  lastResendSyncTime = now;

  try {
    const apiKey = (await getAppSecret('RESEND_API_KEY')) || process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.startsWith('re_')) {
      return { count: 0, newEmails: [] };
    }

    const resend = new Resend(apiKey);
    const listRes = await resend.emails.receiving.list();
    if (listRes.error || !listRes.data || !Array.isArray(listRes.data.data)) {
      return { count: 0, newEmails: [] };
    }

    const emailSummaries = listRes.data.data;
    const store = await readMailStore();
    const existingResendIds = new Set(
      store.messages.map((m) => m.resendId).filter(Boolean)
    );

    const newSummaries = emailSummaries.filter((s) => !existingResendIds.has(s.id));
    if (newSummaries.length === 0) {
      return { count: 0, newEmails: [] };
    }

    const importedIds: string[] = [];
    for (const item of newSummaries) {
      try {
        const fullRes = await resend.emails.receiving.get(item.id);
        if (fullRes.data) {
          const full = fullRes.data;
          await upsertReceivedEmail({
            id: full.id,
            from: full.from,
            to: full.to,
            subject: full.subject,
            html: full.html,
            text: full.text,
            created_at: full.created_at,
            headers: full.headers as Record<string, unknown> | undefined,
            attachments: full.attachments as EmailAttachment[] | undefined,
          });

          // Also deliver to Temp Mail if recipient is a disposable address
          try {
            const { ingestInboundEmail } = await import('@/lib/os/temp-mail');
            await ingestInboundEmail({
              resendId: full.id,
              from: full.from,
              to: full.to,
              subject: full.subject,
              text: full.text,
              html: full.html,
            });
          } catch {
            // ignore non-blocking
          }

          importedIds.push(full.id);
        }
      } catch (e) {
        console.warn(`[MailStore] Error fetching receiving email ${item.id}:`, e);
      }
    }

    return { count: importedIds.length, newEmails: importedIds };
  } catch (err) {
    console.warn('[MailStore] syncReceivedEmailsFromResend error:', err);
    return { count: 0, newEmails: [] };
  }
}
