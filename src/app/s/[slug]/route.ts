import { NextRequest, NextResponse } from 'next/server';
import { getShortLinks, recordLinkClick } from '@/lib/os/short-links';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    if (!slug) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();
    const links = await getShortLinks();
    const targetLink = links.find((l) => l.slug.toLowerCase() === cleanSlug);

    // If link not found
    if (!targetLink) {
      const notFoundUrl = new URL('/s/not-found', req.url);
      notFoundUrl.searchParams.set('slug', cleanSlug);
      return NextResponse.redirect(notFoundUrl);
    }

    // If link is paused / inactive
    if (targetLink.is_active === false) {
      const disabledUrl = new URL('/s/not-found', req.url);
      disabledUrl.searchParams.set('slug', cleanSlug);
      disabledUrl.searchParams.set('status', 'paused');
      return NextResponse.redirect(disabledUrl);
    }

    // Record click counter asynchronously in the background
    recordLinkClick(targetLink.slug).catch((err) => {
      console.warn('Background click tracking error:', err);
    });

    // 307 Temporary Redirect preserves query params & avoids aggressive browser caching
    return NextResponse.redirect(targetLink.original_url, {
      status: 307,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('Error redirecting short link:', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
