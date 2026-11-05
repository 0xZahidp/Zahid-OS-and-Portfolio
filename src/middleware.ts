import { NextRequest, NextResponse } from 'next/server';
import { isPublicRoute } from '@/lib/auth/public-routes';
import { requireAdmin } from '@/lib/auth/admin-auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply default-deny to /api/ routes
  if (pathname.startsWith('/api')) {
    // If route is in explicit public allowlist, allow it through
    if (isPublicRoute(req.method, pathname)) {
      return NextResponse.next();
    }

    // Default deny: require verified admin authentication
    const authFailure = await requireAdmin(req);
    if (authFailure) {
      return authFailure;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};

