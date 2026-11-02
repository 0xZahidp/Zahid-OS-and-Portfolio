import { NextRequest, NextResponse } from 'next/server';
import { getShortLinks, saveShortLinks } from '@/lib/os/short-links';
import { ShortLink } from '@/types/os';

export const dynamic = 'force-dynamic';

function generateRandomSlug(length = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidUrl(stringUrl: string): boolean {
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// 1. GET: Retrieve all short links
export async function GET() {
  try {
    const links = await getShortLinks();
    const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

    return NextResponse.json({
      success: true,
      links,
      totalClicks,
      count: links.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch short links';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// 2. POST: Create or Update a short link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, slug, title, description, is_active } = body;
    let original_url = body.original_url;

    // Validate original_url
    if (!original_url || typeof original_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Destination URL is required.' },
        { status: 400 }
      );
    }

    original_url = original_url.trim();
    if (!original_url.startsWith('http://') && !original_url.startsWith('https://')) {
      original_url = `https://${original_url}`;
    }

    if (!isValidUrl(original_url)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid HTTP or HTTPS destination URL.' },
        { status: 400 }
      );
    }

    // Validate or auto-generate slug
    let cleanSlug = (slug || '').trim().toLowerCase();
    if (!cleanSlug) {
      cleanSlug = generateRandomSlug(6);
    } else {
      // Clean invalid characters
      cleanSlug = cleanSlug.replace(/[^a-z0-9\-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    if (!cleanSlug || cleanSlug.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Slug must be at least 2 alphanumeric characters.' },
        { status: 400 }
      );
    }

    // Reserved system routes that cannot be used as short slugs
    const reservedSlugs = [
      'admin',
      'api',
      'auth',
      'login',
      's',
      'l',
      'reset-password',
      'opengraph-image',
      'favicon.ico',
      'robots.txt',
      'sitemap.xml',
    ];
    if (reservedSlugs.includes(cleanSlug)) {
      return NextResponse.json(
        { success: false, error: `Slug "${cleanSlug}" is a reserved system path. Please choose another.` },
        { status: 400 }
      );
    }

    const currentLinks = await getShortLinks();

    // Check slug collision
    const existingWithSlug = currentLinks.find(
      (l) => l.slug.toLowerCase() === cleanSlug && l.id !== id
    );
    if (existingWithSlug) {
      return NextResponse.json(
        {
          success: false,
          error: `Slug "/s/${cleanSlug}" is already in use by "${existingWithSlug.title || existingWithSlug.original_url}". Choose a unique slug.`,
        },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    let updatedLink: ShortLink;

    if (id) {
      // Update existing
      const targetIndex = currentLinks.findIndex((l) => l.id === id);
      if (targetIndex === -1) {
        return NextResponse.json(
          { success: false, error: 'Short link not found to update.' },
          { status: 404 }
        );
      }

      updatedLink = {
        ...currentLinks[targetIndex],
        slug: cleanSlug,
        original_url,
        title: (title || cleanSlug).trim(),
        description: (description || '').trim(),
        is_active: is_active !== false,
        updated_at: now,
      };

      currentLinks[targetIndex] = updatedLink;
    } else {
      // Create new
      const newId = `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      updatedLink = {
        id: newId,
        slug: cleanSlug,
        original_url,
        title: (title || cleanSlug).trim(),
        description: (description || '').trim(),
        is_active: is_active !== false,
        clicks: 0,
        last_clicked_at: null,
        created_at: now,
        updated_at: now,
      };

      currentLinks.unshift(updatedLink);
    }

    const success = await saveShortLinks(currentLinks);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to persist short link to storage.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      link: updatedLink,
      links: currentLinks,
      message: id ? 'Short link updated successfully.' : 'Short link created successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error processing short link';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// 3. DELETE: Remove a short link
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (!id && !slug) {
      return NextResponse.json(
        { success: false, error: 'Missing id or slug to delete.' },
        { status: 400 }
      );
    }

    const currentLinks = await getShortLinks();
    const initialLen = currentLinks.length;
    const filtered = currentLinks.filter((l) => {
      if (id && l.id === id) return false;
      if (slug && l.slug.toLowerCase() === slug.toLowerCase()) return false;
      return true;
    });

    if (filtered.length === initialLen) {
      return NextResponse.json(
        { success: false, error: 'Link not found to delete.' },
        { status: 404 }
      );
    }

    await saveShortLinks(filtered);

    return NextResponse.json({
      success: true,
      links: filtered,
      message: 'Short link deleted successfully.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete short link';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// 4. PATCH: Quick toggle active or reset clicks
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, is_active, reset_clicks } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Link ID is required.' }, { status: 400 });
    }

    const currentLinks = await getShortLinks();
    const target = currentLinks.find((l) => l.id === id);

    if (!target) {
      return NextResponse.json({ success: false, error: 'Link not found.' }, { status: 404 });
    }

    if (typeof is_active === 'boolean') {
      target.is_active = is_active;
    }
    if (reset_clicks === true) {
      target.clicks = 0;
    }
    target.updated_at = new Date().toISOString();

    await saveShortLinks(currentLinks);

    return NextResponse.json({
      success: true,
      link: target,
      links: currentLinks,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update short link';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
