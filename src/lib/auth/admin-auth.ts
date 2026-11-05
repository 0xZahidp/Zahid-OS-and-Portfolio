import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

interface JwtPayload {
  aal?: string;
  sub?: string;
  [key: string]: unknown;
}

/**
 * Safely parse JWT payload without logging or throwing
 */
function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonStr) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract bearer token from Authorization header or cookies
 */
function extractToken(req: NextRequest): string | null {
  // 1. Authorization Bearer header
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  // 2. Direct sb-access-token cookie
  const directCookie = req.cookies.get('sb-access-token')?.value;
  if (directCookie && directCookie.trim()) {
    return directCookie.trim();
  }

  // 3. Supabase standard auth cookies (e.g. sb-<project>-auth-token)
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      try {
        const decoded = decodeURIComponent(cookie.value);
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
          return parsed[0];
        }
        if (parsed?.access_token && typeof parsed.access_token === 'string') {
          return parsed.access_token;
        }
      } catch {
        if (cookie.value.includes('.')) {
          return cookie.value.trim();
        }
      }
    }
  }

  return null;
}

/**
 * Validate CSRF Origin for mutating methods (POST, PATCH, DELETE, PUT)
 */
function isAllowedOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (!['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
    return true;
  }

  const originHeader = req.headers.get('origin');
  const refererHeader = req.headers.get('referer');
  const candidate = originHeader || (refererHeader ? new URL(refererHeader).origin : null);

  if (!candidate) {
    // Missing origin on state-modifying request
    return false;
  }

  try {
    const candidateOrigin = new URL(candidate).origin;
    const reqOrigin = new URL(req.url).origin;

    if (candidateOrigin === reqOrigin) {
      return true;
    }

    if (process.env.NEXT_PUBLIC_SITE_URL) {
      const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
      if (candidateOrigin === siteOrigin) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Enforce strict admin authorization:
 * - Identifies session via verified Supabase Auth JWT (Bearer header or cookies)
 * - Cryptographically verifies token via supabaseServer().auth.getUser(token)
 * - Requires user.id === process.env.ADMIN_USER_ID (fails closed if ADMIN_USER_ID is missing)
 * - Requires MFA: access token claim aal === "aal2"
 * - Checks CSRF origin on mutating methods (POST, PATCH, DELETE, PUT)
 * - Returns 401 when unauthenticated, 403 when forbidden, with empty body.
 * - Returns null when authorized.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const adminUserId = process.env.ADMIN_USER_ID;

  // Fail closed: if ADMIN_USER_ID is not configured, reject everything
  if (!adminUserId || !adminUserId.trim()) {
    return new NextResponse(null, { status: 403 });
  }

  // Extract access token
  const token = extractToken(req);
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  // Cryptographically verify token server-side with Supabase Auth
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return new NextResponse(null, { status: 401 });
    }

    // Require user.id === ADMIN_USER_ID
    if (data.user.id !== adminUserId.trim()) {
      return new NextResponse(null, { status: 403 });
    }

    // Require MFA (aal2)
    const payload = parseJwtPayload(token);
    const aal = payload?.aal || (data.user.app_metadata as Record<string, unknown> | undefined)?.aal;
    if (aal !== 'aal2') {
      return new NextResponse(null, { status: 403 });
    }

    // CSRF check on mutating methods
    if (!isAllowedOrigin(req)) {
      return new NextResponse(null, { status: 403 });
    }

    // Authorized
    return null;
  } catch {
    return new NextResponse(null, { status: 401 });
  }
}

/**
 * Boolean wrapper for requireAdmin.
 */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const failure = await requireAdmin(req);
  return failure === null;
}
