import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { ShortLink } from '@/types/os';

const SHORT_LINKS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'short-links.json');

/**
 * Read short links from Supabase site_settings (key: 'zahid_os_short_links')
 * with fallback to local JSON file src/data/short-links.json
 */
export async function getShortLinks(): Promise<ShortLink[]> {
  // 1. Try Supabase site_settings
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'zahid_os_short_links')
        .maybeSingle();

      if (!error && data?.value && Array.isArray(data.value)) {
        return data.value as ShortLink[];
      }
    }
  } catch (err) {
    console.warn('Supabase getShortLinks fallback to local file:', err);
  }

  // 2. Fallback to local file
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
 * Save short links to both local JSON file and Supabase site_settings
 */
export async function saveShortLinks(links: ShortLink[]): Promise<boolean> {
  let fileSaved = false;

  // 1. Save to local file
  try {
    await fs.writeFile(SHORT_LINKS_FILE_PATH, JSON.stringify(links, null, 2), 'utf-8');
    fileSaved = true;
  } catch (err) {
    console.error('Error writing short-links.json:', err);
  }

  // 2. Save to Supabase site_settings
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      const supabase = supabaseServer();
      await supabase.from('site_settings').upsert(
        {
          key: 'zahid_os_short_links',
          value: links,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
    }
  } catch (err) {
    console.warn('Error syncing short links to Supabase:', err);
  }

  return fileSaved;
}

/**
 * Record a click on a short link by slug (asynchronous, non-blocking)
 */
export async function recordLinkClick(slug: string): Promise<void> {
  try {
    const links = await getShortLinks();
    const cleanSlug = slug.trim().toLowerCase();
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
