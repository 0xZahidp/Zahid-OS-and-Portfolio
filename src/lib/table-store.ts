import { supabaseServer } from '@/lib/supabase/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PortfolioContent } from '@/types/cms';

export const ALL_TABLE_NAMES = [
  'profiles',
  'bio_paragraphs',
  'experiences',
  'projects',
  'skills',
  'languages',
  'social_links',
  'suggested_people',
  'site_settings',
  'inbox_messages',
] as const;

export type TableName = (typeof ALL_TABLE_NAMES)[number];

const CONTENT_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'portfolio-content.json');
const INBOX_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'inbox-store.json');

/**
 * Sanitize backup export data:
 * Exclude per-domain Resend keys and secrets from app_settings,
 * and strip raw keys from site_settings temp_mail_domains.
 */
function sanitizeBackupRows(tableName: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (tableName === 'app_settings') {
    return rows.filter((row) => {
      const key = String(row.key || '').toUpperCase();
      return !key.startsWith('RESEND_KEY_') && !row.is_secret;
    });
  }

  if (tableName === 'site_settings') {
    return rows.map((row) => {
      if (row.key === 'temp_mail_domains' && Array.isArray(row.value)) {
        return {
          ...row,
          value: row.value.map((d: Record<string, unknown>) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { resendApiKey, ...clean } = d;
            return {
              ...clean,
              resendApiKeyMasked: clean.resendApiKeyMasked
                ? `••••••••••••${String(clean.resendApiKeyMasked).slice(-4)}`
                : undefined,
            };
          }),
        };
      }
      return row;
    });
  }

  return rows;
}

/**
 * Read all data for a specific table (from Supabase if available, else from local JSON)
 */
export async function getTableRows(tableName: string): Promise<Record<string, unknown>[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase.from(tableName).select('*');
      if (!error && Array.isArray(data)) {
        return sanitizeBackupRows(tableName, data as Record<string, unknown>[]);
      }
    } catch {
      // Fallback
    }
  }

  // 2. Fallback to local files
  return sanitizeBackupRows(tableName, await getLocalTableRows(tableName));
}

/**
 * Get rows from local JSON files
 */
export async function getLocalTableRows(tableName: string): Promise<Record<string, unknown>[]> {
  try {
    if (tableName === 'inbox_messages') {
      const inboxData = await fs.readFile(INBOX_FILE_PATH, 'utf-8').catch(() => '{"messages":[]}');
      const parsed = JSON.parse(inboxData);
      const messages = (Array.isArray(parsed) ? parsed : (parsed.messages || [])) as Record<string, unknown>[];
      return messages.map((m) => {
        const fromObj = m.from as { name?: string; email?: string } | undefined;
        const toArr = m.to as Array<{ name?: string; email?: string }> | undefined;
        return {
          id: m.id,
          name: fromObj?.name || (m.name as string) || '',
          email: fromObj?.email || (m.email as string) || '',
          subject: (m.subject as string) || '',
          body: (m.body as string) || '',
          status: m.isRead ? 'read' : 'unread',
          is_starred: Boolean(m.isStarred),
          is_sent: m.folder === 'sent',
          recipient: Array.isArray(toArr) ? toArr.map((t) => t.email || t.name).join(', ') : ((m.recipient as string) || ''),
          created_at: m.createdAt || m.created_at || new Date().toISOString(),
        };
      });
    }

    const contentRaw = await fs.readFile(CONTENT_FILE_PATH, 'utf-8');
    const content = JSON.parse(contentRaw) as PortfolioContent;

    switch (tableName) {
      case 'profiles':
        return [content.profile as unknown as Record<string, unknown>];
      case 'bio_paragraphs':
        return (content.bioParagraphs || []).map((p, i) => ({
          id: `bio-${i + 1}`,
          sort_order: i,
          content: p,
        }));
      case 'experiences':
        return (content.experience || []).map((e, i) => ({ ...e, sort_order: i }));
      case 'projects':
        return (content.projects || []).map((p, i) => ({ ...p, sort_order: i }));
      case 'skills':
        return (content.skills || []).map((s, i) => ({ ...s, sort_order: i }));
      case 'languages':
        return (content.languages || []).map((l, i) => ({
          id: `lang-${l.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          ...l,
          sort_order: i,
        }));
      case 'social_links':
        return (content.socialLinks || []).map((s, i) => ({ ...s, sort_order: i }));
      case 'suggested_people':
        return (content.suggestedPeople || []).map((p, i) => ({ ...p, sort_order: i }));
      case 'site_settings':
        return [
          { key: 'works_settings', value: content.worksSettings },
          { key: 'based_in_settings', value: content.basedInSettings },
          { key: 'github_settings', value: content.githubSettings },
        ];
      default:
        return [];
    }
  } catch (err) {
    console.error(`Failed to read local rows for table ${tableName}:`, err);
    return [];
  }
}

/**
 * Save rows to a specific table (Supabase upsert + local file synchronization)
 */
export async function saveTableRows(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: true, count: 0 };
  }

  // Filter out any secret keys from being restored/overwritten via backup import
  let safeRows = rows;
  if (tableName === 'app_settings') {
    safeRows = rows.filter((r) => {
      const key = String(r.key || '').toUpperCase();
      return !key.startsWith('RESEND_KEY_');
    });
  }

  let supabaseSuccess = false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Try Supabase Upsert
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { error } = await supabase.from(tableName).upsert(safeRows);
      if (!error) {
        supabaseSuccess = true;
      } else {
        console.warn(`Supabase upsert error on ${tableName}:`, error.message);
      }
    } catch (err) {
      console.warn(`Supabase connection error on ${tableName}:`, err);
    }
  }

  // 2. Synchronize to local files
  await syncRowsToLocal(tableName, safeRows);

  return {
    success: true,
    count: safeRows.length,
    error: supabaseSuccess ? undefined : 'Saved locally (Supabase table pending or unavailable)',
  };
}

/**
 * Synchronize table rows into local JSON files so local offline dev and SSR remain 100% in sync
 */
async function syncRowsToLocal(tableName: string, rows: Record<string, unknown>[]) {
  try {
    if (tableName === 'inbox_messages') {
      await fs.writeFile(INBOX_FILE_PATH, JSON.stringify(rows, null, 2), 'utf-8');
      return;
    }

    const contentRaw = await fs.readFile(CONTENT_FILE_PATH, 'utf-8');
    const content = JSON.parse(contentRaw) as PortfolioContent;

    switch (tableName) {
      case 'profiles':
        if (rows[0]) {
          content.profile = rows[0] as unknown as PortfolioContent['profile'];
        }
        break;
      case 'bio_paragraphs':
        content.bioParagraphs = rows
          .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
          .map((r) => String(r.content || ''));
        break;
      case 'experiences':
        content.experience = rows as unknown as PortfolioContent['experience'];
        break;
      case 'projects':
        content.projects = rows as unknown as PortfolioContent['projects'];
        break;
      case 'skills':
        content.skills = rows as unknown as PortfolioContent['skills'];
        break;
      case 'languages':
        content.languages = rows as unknown as PortfolioContent['languages'];
        break;
      case 'social_links':
        content.socialLinks = rows as unknown as PortfolioContent['socialLinks'];
        break;
      case 'suggested_people':
        content.suggestedPeople = rows as unknown as PortfolioContent['suggestedPeople'];
        break;
      case 'site_settings':
        rows.forEach((r) => {
          if (r.key === 'works_settings') content.worksSettings = r.value as PortfolioContent['worksSettings'];
          if (r.key === 'based_in_settings') content.basedInSettings = r.value as PortfolioContent['basedInSettings'];
          if (r.key === 'github_settings') content.githubSettings = r.value as PortfolioContent['githubSettings'];
        });
        break;
    }

    content.updatedAt = new Date().toISOString();
    await fs.writeFile(CONTENT_FILE_PATH, JSON.stringify(content, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to sync rows to local storage:', err);
  }
}
