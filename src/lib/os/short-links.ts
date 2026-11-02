import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { ShortLink } from '@/types/os';

let memoryLinksCache: { links: ShortLink[]; timestamp: number } | null = null;
const LINKS_CACHE_TTL = 20000; // 20s
const SHORT_LINKS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'short-links.json');

/**
 * Read short links with 3-tier fallback:
 * 1. Dedicated Supabase table 'os_short_links' (if created)
 * 2. Supabase 'site_settings' key 'zahid_os_short_links' (active store)
 * 3. Local JSON file 'src/data/short-links.json' (offline / dev fallback)
 */
export async function getShortLinks(): Promise<ShortLink[]> {
  // 0. In-memory cache (<20s)
  if (memoryLinksCache && Date.now() - memoryLinksCache.timestamp < LINKS_CACHE_TTL) {
    return memoryLinksCache.links;
  }

  // 1. Ultra-fast local file read (<1ms)
  try {
    const fileContent = await fs.readFile(SHORT_LINKS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) {
      memoryLinksCache = { links: parsed as ShortLink[], timestamp: Date.now() };
      return parsed as ShortLink[];
    }
  } catch {
    // fallback to Supabase
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    // 1. Try dedicated table 'os_short_links'
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('os_short_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data as ShortLink[];
      }
    } catch {
      // Fall through if table does not exist
    }

    // 2. Try Supabase site_settings JSONB store
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'zahid_os_short_links')
        .maybeSingle();

      if (!error && data?.value && Array.isArray(data.value)) {
        return data.value as ShortLink[];
      }
    } catch (err) {
      console.warn('Supabase site_settings getShortLinks fallback:', err);
    }
  }

  // 3. Fallback to local JSON file
  try {
    const fileContent = await fs.readFile(SHORT_LINKS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) {
      return parsed as ShortLink[];
    }
  } catch (err) {
    console.warn('Failed to read local short-links.json:', err);
  }

  return [];
}

/**
 * Save short links across:
 * 1. Local JSON file
 * 2. Supabase site_settings (key: 'zahid_os_short_links')
 * 3. Supabase dedicated table 'os_short_links' (if exists)
 */
export async function saveShortLinks(links: ShortLink[]): Promise<boolean> {
  memoryLinksCache = null;
  let fileSaved = false;

  // 1. Save to local file
  try {
    await fs.writeFile(SHORT_LINKS_FILE_PATH, JSON.stringify(links, null, 2), 'utf-8');
    fileSaved = true;
  } catch (err) {
    console.error('Error writing short-links.json:', err);
  }

  // 2. Sync to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    const supabase = supabaseServer();

    // 2a. Sync to site_settings (key: 'zahid_os_short_links')
    try {
      await supabase.from('site_settings').upsert(
        {
          key: 'zahid_os_short_links',
          value: links,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    } catch (err) {
      console.warn('Error syncing short links to site_settings:', err);
    }

    // 2b. Sync to dedicated table 'os_short_links' if present
    try {
      if (links.length > 0) {
        await supabase.from('os_short_links').upsert(
          links.map((l) => ({
            id: l.id,
            slug: l.slug,
            original_url: l.original_url,
            title: l.title || l.slug,
            description: l.description || '',
            clicks: l.clicks || 0,
            is_active: l.is_active !== false,
            last_clicked_at: l.last_clicked_at || null,
            created_at: l.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'id' }
        );
      }
    } catch {
      // Table may not exist yet, site_settings already saved
    }
  }

  return fileSaved;
}

/**
 * Record a click on a short link by slug (asynchronous, non-blocking)
 */
export async function recordLinkClick(slug: string): Promise<void> {
  try {
    const cleanSlug = slug.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // If dedicated table exists, attempt atomic increment
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        const { data: linkRow } = await supabase
          .from('os_short_links')
          .select('id, clicks')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (linkRow) {
          await supabase
            .from('os_short_links')
            .update({
              clicks: (linkRow.clicks || 0) + 1,
              last_clicked_at: new Date().toISOString(),
            })
            .eq('id', linkRow.id);
        }
      } catch {
        // Fall back to memory links
      }
    }

    const links = await getShortLinks();
    const targetIndex = links.findIndex((l) => l.slug.toLowerCase() === cleanSlug);

    if (targetIndex !== -1) {
      links[targetIndex].clicks = (links[targetIndex].clicks || 0) + 1;
      links[targetIndex].last_clicked_at = new Date().toISOString();
      await saveShortLinks(links);
    }
  } catch (err) {
    console.warn('Failed to record link click:', err);
  }
}
