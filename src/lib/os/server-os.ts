import { unstable_cache } from 'next/cache';
import { getOsSettings } from '@/lib/os/settings';
import { getShortLinks } from '@/lib/os/short-links';
import { ShortLink, ZahidOsSettings } from '@/types/os';

/**
 * Cached server-side fetch for Zahid OS settings.
 * Revalidated on-demand when admin saves OS settings, with 1-hour fallback.
 */
export const getCachedOsSettings = unstable_cache(
  async (): Promise<ZahidOsSettings> => {
    return await getOsSettings();
  },
  ['zahid-os-settings-cache'],
  {
    tags: ['os-settings'],
    revalidate: 3600,
  }
);

/**
 * Cached server-side fetch for public short links.
 * Revalidated on-demand when admin or users create/update links.
 */
export const getCachedPublicLinks = unstable_cache(
  async (): Promise<ShortLink[]> => {
    try {
      const allLinks = await getShortLinks();
      return (Array.isArray(allLinks) ? allLinks : [])
        .filter((l) => l.is_active !== false)
        .map((l) => ({
          id: l.id,
          slug: l.slug,
          original_url: l.original_url,
          title: l.title,
          description: l.description || '',
          clicks: l.clicks || 0,
          is_active: true,
          created_at: l.created_at,
          updated_at: l.updated_at,
        }));
    } catch {
      return [];
    }
  },
  ['zahid-os-public-links-cache'],
  {
    tags: ['os-links'],
    revalidate: 3600,
  }
);
