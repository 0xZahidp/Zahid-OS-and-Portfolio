import { promises as fs } from 'node:fs';
import path from 'node:path';
import { MailMessage, MailStoreData } from '@/types/mail';

const STORE_PATH = path.join(process.cwd(), 'src', 'data', 'inbox-store.json');

export async function readMailStore(): Promise<MailStoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(raw) as MailStoreData;
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
  let msgs = store.messages;

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
  return store.messages.filter((m) => m.folder === 'inbox' && !m.isRead).length;
}

export async function addMailMessage(message: MailMessage): Promise<boolean> {
  const store = await readMailStore();
  // Check if exists
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
  const idx = store.messages.findIndex((m) => m.id === id);
  if (idx < 0) return false;

  if (permanent || store.messages[idx].folder === 'trash') {
    // Completely remove
    store.messages.splice(idx, 1);
  } else {
    // Move to trash
    store.messages[idx].folder = 'trash';
  }

  return writeMailStore(store);
}

export async function emptyTrash(): Promise<number> {
  const store = await readMailStore();
  const originalLength = store.messages.length;
  store.messages = store.messages.filter((m) => m.folder !== 'trash');
  await writeMailStore(store);
  return originalLength - store.messages.length;
}

