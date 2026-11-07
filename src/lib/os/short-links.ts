import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { ShortLink } from '@/types/os';

let memoryLinksCache: { links: ShortLink[]; timestamp: number } | null = null;
const LINKS_CACHE_TTL = 5000; // 5s in-memory cache
const SHORT_LINKS_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'short-links.json');

export function clearShortLinksCache(): void {
  memoryLinksCache = null;
}

/**
 * Read short links with Supabase as PRIMARY source of truth:
 * 1. Dedicated Supabase relational table 'os_short_links'
 * 2. Supabase 'site_settings' key 'zahid_os_short_links' (backup)
 * 3. Local JSON file 'src/data/short-links.json' (offline / dev fallback)
 */
export async function getShortLinks(): Promise<ShortLink[]> {
  // 0. Return in-memory cache if warm (<5s)
  if (memoryLinksCache && Date.now() - memoryLinksCache.timestamp < LINKS_CACHE_TTL) {
    return memoryLinksCache.links;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Supabase PRIMARY: Query dedicated 'os_short_links' table
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('os_short_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const formatted: ShortLink[] = data.map((item) => ({
          id: item.id,
          slug: item.slug,
          original_url: item.original_url,
          title: item.title || item.slug,
          description: item.description || '',
          clicks: item.clicks || 0,
          is_active: item.is_active !== false,
          last_clicked_at: item.last_clicked_at || null,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }));

        memoryLinksCache = { links: formatted, timestamp: Date.now() };

        // Asynchronously mirror to local backup file (safely ignore in read-only envs, skip on Vercel)
        if (!process.env.VERCEL) {
          fs.writeFile(SHORT_LINKS_FILE_PATH, JSON.stringify(formatted, null, 2), 'utf-8').catch(
            () => {}
          );
        }

        return formatted;
      }
    } catch (err) {
      console.warn('[ShortLinks] os_short_links table read error, checking site_settings:', err);
    }

    // 2. Supabase site_settings JSONB store fallback
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'zahid_os_short_links')
        .maybeSingle();

      if (!error && data?.value && Array.isArray(data.value) && data.value.length > 0) {
        const list = data.value as ShortLink[];
        memoryLinksCache = { links: list, timestamp: Date.now() };
        if (!process.env.VERCEL) {
          fs.writeFile(SHORT_LINKS_FILE_PATH, JSON.stringify(list, null, 2), 'utf-8').catch(() => {});
        }
        return list;
      }
    } catch (err) {
      console.warn('[ShortLinks] Supabase site_settings fallback read error:', err);
    }
  }

  // 3. Fallback to local JSON file (offline / dev fallback)
  try {
    const fileContent = await fs.readFile(SHORT_LINKS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) {
      memoryLinksCache = { links: parsed as ShortLink[], timestamp: Date.now() };
      return parsed as ShortLink[];
    }
  } catch (err) {
    console.warn('[ShortLinks] Failed to read local short-links.json:', err);
  }

  return [];
}

/**
 * Ultra-fast lookup of a single link by slug for redirection
 */
export async function getShortLinkBySlug(slug: string): Promise<ShortLink | null> {
  const cleanSlug = slug.trim().toLowerCase();

  // Check warm cache
  if (memoryLinksCache) {
    const match = memoryLinksCache.links.find((l) => l.slug.toLowerCase() === cleanSlug);
    if (match) return match;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data, error } = await supabase
        .from('os_short_links')
        .select('*')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          slug: data.slug,
          original_url: data.original_url,
          title: data.title || data.slug,
          description: data.description || '',
          clicks: data.clicks || 0,
          is_active: data.is_active !== false,
          last_clicked_at: data.last_clicked_at || null,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('[ShortLinks] Direct slug lookup error:', err);
    }
  }

  const allLinks = await getShortLinks();
  return allLinks.find((l) => l.slug.toLowerCase() === cleanSlug) || null;
}

/**
 * Save short links:
 * 1. Upserts to Supabase 'os_short_links' table (and cleans up deleted rows)
 * 2. Mirrors to Supabase 'site_settings' (key: 'zahid_os_short_links')
 * 3. Writes to local 'short-links.json' file (safely catches read-only errors)
 */
export async function saveShortLinks(links: ShortLink[]): Promise<boolean> {
  memoryLinksCache = null;
  let supabaseSaved = false;
  let fileSaved = false;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Save to Supabase (Primary)
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();

      // 1a. Upsert active rows into dedicated table
      if (links.length > 0) {
        const { error: upsertErr } = await supabase.from('os_short_links').upsert(
          links.map((l) => ({
            id: l.id,
            slug: l.slug.toLowerCase().trim(),
            original_url: l.original_url.trim(),
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

        if (!upsertErr) {
          supabaseSaved = true;
        } else {
          console.warn('[ShortLinks] Supabase os_short_links upsert error:', upsertErr);
        }

        // Clean up deleted rows from the table
        const activeIds = links.map((l) => l.id);
        const { data: currentDbRows } = await supabase.from('os_short_links').select('id');
        if (currentDbRows && currentDbRows.length > 0) {
          const removedIds = currentDbRows
            .filter((row) => !activeIds.includes(row.id))
            .map((row) => row.id);

          if (removedIds.length > 0) {
            await supabase.from('os_short_links').delete().in('id', removedIds);
          }
        }
      } else {
        await supabase.from('os_short_links').delete().neq('id', '');
        supabaseSaved = true;
      }

      // 1b. Sync to site_settings JSONB store
      const { error: settingsErr } = await supabase.from('site_settings').upsert(
        {
          key: 'zahid_os_short_links',
          value: links,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );

      if (!settingsErr) {
        supabaseSaved = true;
      }
    } catch (err) {
      console.warn('[ShortLinks] Error persisting to Supabase:', err);
    }
  }

  // 2. Save to local JSON file (safely ignore EROFS in read-only / serverless, skip on Vercel)
  if (!process.env.VERCEL) {
    try {
      await fs.writeFile(SHORT_LINKS_FILE_PATH, JSON.stringify(links, null, 2), 'utf-8');
      fileSaved = true;
    } catch (err) {
      console.warn('[ShortLinks] Local short-links.json write skipped (read-only environment):', err);
    }
  }

  memoryLinksCache = { links, timestamp: Date.now() };

  // True if saved to Supabase OR local file (or on Vercel where Supabase saved)
  return supabaseSaved || fileSaved || Boolean(process.env.VERCEL && supabaseSaved);
}

/**
 * Delete a short link directly by ID or Slug from Supabase and local store
 */
export async function deleteShortLink(id: string, slug?: string): Promise<boolean> {
  memoryLinksCache = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      if (id) {
        await supabase.from('os_short_links').delete().eq('id', id);
      } else if (slug) {
        await supabase.from('os_short_links').delete().eq('slug', slug.toLowerCase().trim());
      }
    } catch (err) {
      console.warn('[ShortLinks] Failed to delete from os_short_links table:', err);
    }
  }

  // Update current list and persist
  const current = await getShortLinks();
  const filtered = current.filter(
    (l) => l.id !== id && (!slug || l.slug.toLowerCase() !== slug.toLowerCase().trim())
  );
  return await saveShortLinks(filtered);
}

/**
 * Record a click on a short link by slug (atomic, non-blocking)
 * Does NOT rewrite the entire JSON file during redirection to prevent race conditions & JSON corruptions.
 */
export async function recordLinkClick(slug: string): Promise<void> {
  const cleanSlug = slug.trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // 1. Direct atomic increment in Supabase table
  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();
      const { data: linkRow } = await supabase
        .from('os_short_links')
        .select('id, clicks')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (linkRow) {
        const newClicks = (linkRow.clicks || 0) + 1;
        const now = new Date().toISOString();
        await supabase
          .from('os_short_links')
          .update({
            clicks: newClicks,
            last_clicked_at: now,
            updated_at: now,
          })
          .eq('id', linkRow.id);

        // Update in-memory cache in place without disk write
        if (memoryLinksCache) {
          const match = memoryLinksCache.links.find((l) => l.id === linkRow.id);
          if (match) {
            match.clicks = newClicks;
            match.last_clicked_at = now;
          }
        }
        return;
      }
    } catch (err) {
      console.warn('[ShortLinks] Atomic click increment in os_short_links error:', err);
    }
  }

  // 2. Fallback: update in-memory cache
  if (memoryLinksCache) {
    const match = memoryLinksCache.links.find((l) => l.slug.toLowerCase() === cleanSlug);
    if (match) {
      match.clicks = (match.clicks || 0) + 1;
      match.last_clicked_at = new Date().toISOString();
    }
  }
}
