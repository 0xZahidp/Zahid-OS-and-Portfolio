import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MailMessage, MailStoreData, EmailAttachment } from '@/types/mail';
import { supabaseServer } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { getAppSecret } from '@/lib/env-vault';

const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'inbox-store.json');

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
      item.isArchived || item.is_archived || item.folder === 'archive' || item.status === 'archived'
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

    return {
      id: String(item.id || `msg_${Date.now()}`),
      resendId: (item.resendId || item.resend_id) as string | undefined,
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
  const isArchived = Boolean(item.is_archived || item.folder === 'archive' || item.status === 'archived');

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

  return {
    id: String(item.id || `msg_${Date.now()}`),
    resendId: (item.resend_id || item.resendId) as string | undefined,
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

export async function readMailStore(): Promise<MailStoreData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase relational table first (newest first)
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('inbox_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          updatedAt: new Date().toISOString(),
          messages: data.map((d) => normalizeMessage(d as Record<string, unknown>)),
        };
      }
    } catch {
      // Fall through to local file
    }
  }

  // 2. Read local JSON store file
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
  return (msgs || []).filter(
    (m) =>
      (m.folder === 'inbox' || !m.folder) &&
      !m.isRead &&
      !m.isTrashed &&
      !m.isArchived
  ).length;
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
  const allMsgs = msgs || [];

  let inbox = 0;
  let unread = 0;
  let sent = 0;
  let starred = 0;
  let archive = 0;
  let trash = 0;
  let official = 0;
  let temp = 0;

  for (const m of allMsgs) {
    const isT = isTempEmail(m);
    if (isT) temp++;
    else official++;

    if (m.isTrashed || m.folder === 'trash') {
      trash++;
    } else if (m.isArchived || m.folder === 'archive') {
      archive++;
    } else if (m.direction === 'outbound' || m.folder === 'sent') {
      sent++;
    } else {
      if (filterCategory === 'temp') {
        if (isT) {
          inbox++;
          if (!m.isRead) unread++;
        }
      } else if (filterCategory === 'official') {
        if (!isT) {
          inbox++;
          if (!m.isRead) unread++;
        }
      } else {
        inbox++;
        if (!m.isRead) unread++;
      }
    }

    if (m.isStarred && !m.isTrashed && m.folder !== 'trash') {
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

export async function getUnreadCount(): Promise<number> {
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
  const inReplyTo = email.headers?.['in-reply-to'] || '';
  const referencesHeader = email.headers?.references || '';

  const id = `msg_resend_${email.id}`;

  const richRow = {
    id,
    resend_id: email.id,
    from_name: fromName,
    from_email: fromEmail,
    to_email: toEmail,
    subject,
    text_body: textBody,
    html_body: htmlBody,
    received_at: receivedAt,
    is_read: false,
    is_starred: false,
    is_trashed: false,
    is_archived: false,
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

      // Check if already exists by resend_id or id
      const { data: existing } = await supabase
        .from('inbox_messages')
        .select('*')
        .or(`resend_id.eq.${email.id},id.eq.${id}`)
        .maybeSingle();

      if (existing) {
        // Preserve user state (status, is_starred, etc.) if already exists
        const existingStatus = existing.status || (existing.is_read ? 'read' : 'unread');
        const updateRow = {
          ...richRow,
          status: existingStatus,
          is_read: existing.is_read ?? (existingStatus === 'read'),
          is_starred: existing.is_starred ?? false,
          is_trashed: existing.is_trashed ?? (existingStatus === 'trash'),
          is_archived: existing.is_archived ?? (existingStatus === 'archived'),
        };

        const { error: updateErr } = await supabase
          .from('inbox_messages')
          .update(updateRow)
          .eq('id', existing.id);

        if (updateErr && updateErr.message?.includes('column')) {
          await supabase
            .from('inbox_messages')
            .update({
              name: fromName,
              email: fromEmail,
              recipient: toEmail,
              subject,
              body: textBody || htmlBody || '',
              status: existingStatus,
              created_at: receivedAt,
            })
            .eq('id', existing.id);
        }
      } else {
        // Insert new row
        const { error: insertErr } = await supabase
          .from('inbox_messages')
          .insert(richRow);

        if (insertErr && insertErr.message?.includes('column')) {
          await supabase.from('inbox_messages').insert({
            id,
            name: fromName,
            email: fromEmail,
            recipient: toEmail,
            subject,
            body: textBody || htmlBody || '',
            status: 'unread',
            is_starred: false,
            is_sent: false,
            created_at: receivedAt,
          });
        }
      }
    } catch (err) {
      console.warn('[MailStore] Supabase upsert error for received email:', err);
    }
  }

  // Also update local store
  const store = await readMailStore();
  const normalized = normalizeMessage(richRow);
  const existingIdx = store.messages.findIndex((m) => m.resendId === email.id || m.id === id);
  if (existingIdx >= 0) {
    store.messages[existingIdx] = {
      ...normalized,
      isRead: store.messages[existingIdx].isRead,
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

  const richRow = {
    id: sent.id,
    resend_id: sent.resendId || null,
    from_name: sent.fromName,
    from_email: sent.fromEmail,
    to_email: sent.toEmail,
    subject: sent.subject,
    text_body: sent.text,
    html_body: sent.html || '',
    received_at: createdAt,
    is_read: true,
    is_starred: false,
    is_trashed: false,
    is_archived: false,
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

  const store = await readMailStore();
  const normalized = normalizeMessage(richRow);
  store.messages.unshift(normalized);
  await writeMailStore(store);

  return normalized;
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
        patch.status = updates.isTrashed ? 'trash' : updated.isRead ? 'read' : 'unread';
      }
      if (typeof updates.isArchived === 'boolean') {
        patch.is_archived = updates.isArchived;
        patch.status = updates.isArchived ? 'archived' : updated.isRead ? 'read' : 'unread';
      }

      if (updates.folder === 'trash') {
        patch.is_trashed = true;
        patch.is_archived = false;
        patch.status = 'trash';
      } else if (updates.folder === 'archive') {
        patch.is_trashed = false;
        patch.is_archived = true;
        patch.status = 'archived';
      } else if (updates.folder === 'inbox') {
        patch.is_trashed = false;
        patch.is_archived = false;
        patch.status = updated.isRead ? 'read' : 'unread';
        patch.direction = 'inbound';
      } else if (updates.folder === 'sent') {
        patch.is_trashed = false;
        patch.is_archived = false;
        patch.status = 'read';
        patch.direction = 'outbound';
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
        const { error } = await supabase
          .from('inbox_messages')
          .update({ is_trashed: true, is_archived: false, status: 'trash' })
          .eq('id', id);

        if (error && error.message?.includes('column')) {
          await supabase.from('inbox_messages').update({ status: 'trash' }).eq('id', id);
        }
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
