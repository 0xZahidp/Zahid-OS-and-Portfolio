import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MailMessage, MailStoreData } from '@/types/mail';
import { supabaseServer } from '@/lib/supabase/server';

const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'inbox-store.json');

/**
 * Normalizes either a standard MailMessage or a relational Supabase/table-store row into a MailMessage.
 */
function normalizeMessage(item: Record<string, unknown>): MailMessage {
  const rawFrom = item.from;
  const rawTo = item.to;

  const isStandardFormat = rawFrom && typeof rawFrom === 'object' && item.folder;

  if (isStandardFormat) {
    const fromObj = rawFrom as { name?: string; email?: string };
    const toArr = Array.isArray(rawTo) ? (rawTo as Array<{ name?: string; email?: string }>) : [];

    return {
      id: String(item.id || `msg_${Date.now()}`),
      folder: (item.folder as 'inbox' | 'sent' | 'trash') || 'inbox',
      from: {
        name: fromObj?.name || 'Sender',
        email: fromObj?.email || '',
      },
      to:
        toArr.length > 0
          ? toArr.map((t) => ({ name: t.name || 'Recipient', email: t.email || '' }))
          : [{ name: 'Md Zahid Hasan', email: 'hello@zahidp.com' }],
      replyTo: (item.replyTo as string) || fromObj?.email,
      subject: String(item.subject || ''),
      body: String(item.body || ''),
      snippet: String(item.snippet || (item.body ? String(item.body).substring(0, 120) : '')),
      createdAt: String(item.createdAt || item.created_at || new Date().toISOString()),
      isRead: Boolean(item.isRead ?? (item.status === 'read')),
      isStarred: Boolean(item.isStarred ?? item.is_starred),
      resendId: item.resendId as string | undefined,
      tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    };
  }

  // Relational table format (Supabase inbox_messages table or CSV backup)
  const isSent = Boolean(item.is_sent || item.folder === 'sent');
  const isTrash = item.folder === 'trash' || item.status === 'trash';
  const folder: 'inbox' | 'sent' | 'trash' = isTrash ? 'trash' : isSent ? 'sent' : 'inbox';

  const fromEmail = isSent ? 'hello@zahidp.com' : String(item.email || 'guest@example.com');
  const fromName = isSent ? 'Md Zahid Hasan' : String(item.name || 'Anonymous');
  const toEmail = isSent ? String(item.recipient || item.email || '') : 'hello@zahidp.com';
  const toName = isSent ? 'Recipient' : 'Md Zahid Hasan';

  return {
    id: String(item.id || `msg_${Date.now()}`),
    folder,
    from: { name: fromName, email: fromEmail },
    to: [{ name: toName, email: toEmail }],
    replyTo: (item.replyTo as string) || (item.email as string),
    subject: String(item.subject || ''),
    body: String(item.body || ''),
    snippet: String(item.snippet || (item.body ? String(item.body).substring(0, 120) : '')),
    createdAt: String(item.created_at || item.createdAt || new Date().toISOString()),
    isRead: Boolean(item.isRead ?? (item.status === 'read')),
    isStarred: Boolean(item.isStarred ?? item.is_starred),
    resendId: item.resendId as string | undefined,
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : (isSent ? ['Outbound'] : ['Inquiry']),
  };
}

export async function readMailStore(): Promise<MailStoreData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase relational table first
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

    // If Supabase is connected but empty, seed the messages into Supabase
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co') && messages.length > 0) {
      try {
        const supabase = supabaseServer();
        const rows = messages.map((m) => ({
          id: m.id,
          name: m.from.name,
          email: m.from.email,
          subject: m.subject,
          body: m.body,
          status: m.isRead ? 'read' : 'unread',
          is_starred: Boolean(m.isStarred),
          is_sent: m.folder === 'sent',
          recipient: m.to.map((t) => t.email || t.name).join(', '),
          created_at: m.createdAt,
        }));
        await supabase.from('inbox_messages').upsert(rows);
      } catch {
        // Silently continue
      }
    }

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

    // Also sync to Supabase relational table if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        const rows = data.messages.map((m) => ({
          id: m.id,
          name: m.from.name,
          email: m.from.email,
          subject: m.subject,
          body: m.body,
          status: m.isRead ? 'read' : 'unread',
          is_starred: Boolean(m.isStarred),
          is_sent: m.folder === 'sent',
          recipient: m.to.map((t) => t.email || t.name).join(', '),
          created_at: m.createdAt,
        }));
        await supabase.from('inbox_messages').upsert(rows);
      } catch (err) {
        console.warn('[MailStore] Supabase sync warning:', err);
      }
    }

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
      msgs = msgs.filter((m) => m.isStarred && m.folder !== 'trash');
    } else {
      msgs = msgs.filter((m) => m.folder === filter.folder);
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

  // Sort descending by date
  return msgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getUnreadCount(): Promise<number> {
  const store = await readMailStore();
  const msgs = store.messages || [];
  return msgs.filter((m) => m.folder === 'inbox' && !m.isRead).length;
}

export async function addMailMessage(message: MailMessage): Promise<boolean> {
  const store = await readMailStore();
  if (!Array.isArray(store.messages)) {
    store.messages = [];
  }
  const existingIdx = store.messages.findIndex((m) => m.id === message.id);
  if (existingIdx >= 0) {
    store.messages[existingIdx] = message;
  } else {
    store.messages.unshift(message);
  }
  return writeMailStore(store);
}

export async function updateMailMessage(
  id: string,
  updates: Partial<MailMessage>
): Promise<MailMessage | null> {
  const store = await readMailStore();
  if (!Array.isArray(store.messages)) {
    store.messages = [];
  }
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx < 0) return null;

  store.messages[idx] = {
    ...store.messages[idx],
    ...updates,
  };
  await writeMailStore(store);
  return store.messages[idx];
}

export async function deleteMailMessage(id: string, permanent: boolean = false): Promise<boolean> {
  const store = await readMailStore();
  if (!Array.isArray(store.messages)) {
    return false;
  }
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx < 0) return false;

  if (permanent || store.messages[idx].folder === 'trash') {
    store.messages.splice(idx, 1);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        await supabase.from('inbox_messages').delete().eq('id', id);
      } catch {}
    }
  } else {
    store.messages[idx].folder = 'trash';
  }

  return writeMailStore(store);
}

export async function emptyTrash(): Promise<number> {
  const store = await readMailStore();
  if (!Array.isArray(store.messages)) {
    return 0;
  }
  const trashIds = store.messages.filter((m) => m.folder === 'trash').map((m) => m.id);
  const originalLength = store.messages.length;
  store.messages = store.messages.filter((m) => m.folder !== 'trash');

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
