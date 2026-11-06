/**
 * Strict allowlist of public API endpoints accessible without admin authentication.
 * All other /api/** routes default to DENY (401 / 403 via requireAdmin).
 */
export interface PublicRoute {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  reason: string;
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  {
    method: 'POST',
    path: '/api/mail/contact',
    reason: 'Public contact form on portfolio. Rate-limited and validated server-side.',
  },
  {
    method: 'GET',
    path: '/api/content',
    reason: 'Public portfolio content (profile, projects, experience, public badges). Filtered server-side to public fields only.',
  },
  {
    method: 'GET',
    path: '/api/github',
    reason: 'Public GitHub contribution calendar and public pinned repositories. Cached for 1 hour. Never exposes token or private data.',
  },
  {
    method: 'GET',
    path: '/api/os/settings',
    reason: 'Public Zahid OS configuration (desktop layout, wallpaper, enabled micro-apps).',
  },
  {
    method: 'GET',
    path: '/api/os/short-links',
    reason: 'Public short links directory (filtered strictly to is_active=true).',
  },
  {
    method: 'GET',
    path: '/api/os/travel',
    reason: 'Public Bangladesh travel map and memories ledger for /travel and /os.',
  },
  {
    method: 'GET',
    path: '/api/os/temp-mail/domains',
    reason: 'Read-only list of available email domains for guest temp-mail generator.',
  },
  {
    method: 'POST',
    path: '/api/os/temp-mail',
    reason: 'Guest temp mail inbox creation with rate limiting per IP and auto-expiration.',
  },
  {
    method: 'GET',
    path: '/api/os/temp-mail',
    reason: 'Read temp mail messages for an active inbox by secret token and rate limit.',
  },
  {
    method: 'DELETE',
    path: '/api/os/temp-mail',
    reason: 'Guest temp mail inbox deletion with secret token verification.',
  },
  {
    method: 'POST',
    path: '/api/webhooks/resend',
    reason: 'Inbound email webhook from Resend. Verified with Svix signature.',
  },
  {
    method: 'POST',
    path: '/api/auth/reset-password',
    reason: 'Admin password reset endpoint. Validates Supabase recovery token and verifies user.id === ADMIN_USER_ID.',
  },
  {
    method: 'GET',
    path: '/api/health-ping',
    reason: 'Public keep-alive ping for Supabase. Executes minimal service-role query, rate-limited, returns no data.',
  },
];

/**
 * Checks whether an incoming request method and pathname match an allowlisted public route.
 */
export function isPublicRoute(method: string, pathname: string): boolean {
  const normMethod = method.toUpperCase();
  const normPath = pathname.replace(/\/$/, '') || '/';

  return PUBLIC_ROUTES.some((route) => {
    return route.method === normMethod && route.path === normPath;
  });
}
