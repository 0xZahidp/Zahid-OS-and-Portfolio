import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// In-memory rate limiting: max 30 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;
const ipRequestLog = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestLog.get(ip);

  if (!record || now > record.expiresAt) {
    ipRequestLog.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

// Periodic cleanup of expired rate limit entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestLog.entries()) {
      if (now > record.expiresAt) {
        ipRequestLog.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Public keep-alive health ping endpoint.
 * Executes a minimal service-role query against site_settings to prevent
 * Supabase free-tier project dormancy, rate-limited per IP, returning
 * strictly {"ok":true} with no database or sensitive data.
 */
export async function GET(req: NextRequest) {
  // 1. IP rate limiting
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Cache-Control': 'no-store',
          'Retry-After': '60',
        },
      }
    );
  }

  // 2. Minimal service-role query to keep database active
  try {
    const supabase = supabaseServer();
    await supabase.from('site_settings').select('key').limit(1);
  } catch {
    // Fail silently without exposing database connection errors
  }

  // 3. Return strictly {"ok":true} with Cache-Control: no-store
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

