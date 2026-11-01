import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MailMessage, MailStoreData, EmailAttachment } from '@/types/mail';
import { supabaseServer } from '@/lib/supabase/server';

const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'inbox-store.json');

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
    const isTrashed = Boolean(item.isTrashed ?? item.is_trashed ?? item.folder === 'trash');
    const folder = isTrashed ? 'trash' : ((item.folder as 'inbox' | 'sent' | 'trash') || 'inbox');

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
  const folder: 'inbox' | 'sent' | 'trash' = isTrashed ? 'trash' : isSent ? 'sent' : 'inbox';

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
    isRead: Boolean(item.is_read ?? (item.status === 'read')),
    isStarred: Boolean(item.is_starred ?? item.isStarred),
    isTrashed,
    label: (item.label as string) || 'inbox',
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
  try {
    data.updatedAt = new Date().toISOString();

    if (!Array.isArray(data.messages)) {
      data.messages = [];
    }

    data.messages = data.messages.map((m) => normalizeMessage(m as unknown as Record<string, unknown>));

    await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return true;
  } catch (err) {
    console.error('[MailStore] Failed to write mail store:', err);
    return false;
  }
}

export async function listMailMessages(filter?: {
  folder?: string;
  search?: string;
  isStarred?: boolean;
}): Promise<MailMessage[]> {
  const store = await readMailStore();
  let msgs = store.messages || [];

  if (filter?.folder) {
    if (filter.folder === 'starred') {
      msgs = msgs.filter((m) => m.isStarred && !m.isTrashed && m.folder !== 'trash');
    } else if (filter.folder === 'trash') {
      msgs = msgs.filter((m) => m.isTrashed || m.folder === 'trash');
    } else if (filter.folder === 'sent') {
      msgs = msgs.filter((m) => (m.direction === 'outbound' || m.folder === 'sent') && !m.isTrashed);
    } else {
      // 'inbox'
      msgs = msgs.filter((m) => m.folder === 'inbox' && m.direction !== 'outbound' && !m.isTrashed);
    }
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    msgs = msgs.filter(
      (m) =>
        m.subject.toLowerCase().includes(q) ||
        m.from.name.toLowerCase().includes(q) ||
        m.from.email.toLowerCase().includes(q) ||
        m.snippet.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q)
    );
  }

  // Sort descending by date (newest first)
  return msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUnreadCount(): Promise<number> {
  const store = await readMailStore();
  const msgs = store.messages || [];
  return msgs.filter((m) => m.folder === 'inbox' && !m.isRead && !m.isTrashed).length;
}

export async function addMailMessage(message: MailMessage): Promise<boolean> {
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
        .select('id')
        .or(`resend_id.eq.${email.id},id.eq.${id}`)
        .maybeSingle();

      if (existing) {
        // Update existing row
        const { error: updateErr } = await supabase
          .from('inbox_messages')
          .update(richRow)
          .eq('id', existing.id);

        if (updateErr && updateErr.message?.includes('column')) {
          // Fallback to base columns if rich columns are pending migration
          await supabase
            .from('inbox_messages')
            .update({
              name: fromName,
              email: fromEmail,
              recipient: toEmail,
              subject,
              body: textBody || htmlBody || '',
              status: 'unread',
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
          // Fallback to base columns if rich columns are pending migration
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
    store.messages[existingIdx] = normalized;
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

  store.messages[idx] = {
    ...store.messages[idx],
    ...updates,
  };

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
      }
      if (updates.folder === 'trash') {
        patch.is_trashed = true;
      } else if (updates.folder === 'inbox') {
        patch.is_trashed = false;
        patch.direction = 'inbound';
      } else if (updates.folder === 'sent') {
        patch.is_trashed = false;
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
  return store.messages[idx];
}

export async function deleteMailMessage(id: string, permanent: boolean = false): Promise<boolean> {
  const store = await readMailStore();
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx < 0) return false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (permanent || store.messages[idx].isTrashed || store.messages[idx].folder === 'trash') {
    store.messages.splice(idx, 1);
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        await supabase.from('inbox_messages').delete().eq('id', id);
      } catch {}
    }
  } else {
    store.messages[idx].isTrashed = true;
    store.messages[idx].folder = 'trash';
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        const { error } = await supabase.from('inbox_messages').update({ is_trashed: true }).eq('id', id);
        if (error && error.message?.includes('column')) {
          // If is_trashed column does not exist, delete directly
          await supabase.from('inbox_messages').delete().eq('id', id);
        }
      } catch {}
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
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co') && trashIds.length > 0) {
    try {
      const supabase = supabaseServer();
      await supabase.from('inbox_messages').delete().in('id', trashIds);
    } catch {}
  }

  await writeMailStore(store);
  return originalLength - store.messages.length;
}
