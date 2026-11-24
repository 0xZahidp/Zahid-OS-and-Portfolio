import { NextRequest, NextResponse } from 'next/server';
import { isPublicRoute } from '@/lib/auth/public-routes';
import { requireAdmin } from '@/lib/auth/admin-auth';

function applyRobotsHeader(res: NextResponse): NextResponse {
  const isNoIndexEnv =
    process.env.SITE_NOINDEX === 'true' ||
    (Boolean(process.env.VERCEL_ENV) && process.env.VERCEL_ENV !== 'production');

  if (isNoIndexEnv) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply default-deny to /api/ routes
  if (pathname.startsWith('/api')) {
    // If route is in explicit public allowlist, allow it through
    if (isPublicRoute(req.method, pathname)) {
      return applyRobotsHeader(NextResponse.next());
    }

    // Default deny: require verified admin authentication
    const authFailure = await requireAdmin(req);
    if (authFailure) {
      return applyRobotsHeader(authFailure);
    }
  }

  return applyRobotsHeader(NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|pdf)$).*)',
    '/api/:path*',
  ],
};
