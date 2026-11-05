import { NextRequest, NextResponse } from 'next/server';
import {
  createTempInbox,
  getTempInboxMessages,
  deleteTempInbox,
  resolveTempMailDomain,
  ingestInboundEmail,
} from '@/lib/os/temp-mail';
import { getTempMailDomains } from '@/lib/os/temp-mail-domains';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const getIpRateLimits = new Map<string, RateLimitBucket>();
const postIpRateLimits = new Map<string, RateLimitBucket>();

function checkRateLimit(
  map: Map<string, RateLimitBucket>,
  ip: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const bucket = map.get(ip);
  if (!bucket || now > bucket.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= maxRequests) {
    return false;
  }
  bucket.count++;
  return true;
}

const lastTempMailCheckTimes = new Map<string, number>();

async function checkResendForInbox(inboxParam: string, existingResendIds: Set<string>): Promise<boolean> {
  const now = Date.now();
  const lastCheck = lastTempMailCheckTimes.get(inboxParam) || 0;
  // Limit to at most once per 20 seconds
  if (now - lastCheck < 20000) return false;
  lastTempMailCheckTimes.set(inboxParam, now);

  const targetDomain = inboxParam.split('@')[1]?.toLowerCase().trim();
  const { getResendKeyForDomain } = await import('@/lib/os/temp-mail-domains');
  const apiKey = await getResendKeyForDomain(targetDomain);
  if (!apiKey || !apiKey.startsWith('re_')) return false;

  const resend = new Resend(apiKey);
  const listRes = await resend.emails.receiving.list();
  if (listRes.error || !Array.isArray(listRes.data?.data)) return false;

  const targetUsername = inboxParam.split('@')[0].toLowerCase();
  const targetAddress = inboxParam.toLowerCase();

  const matching = listRes.data.data.filter((item) => {
    const toArr = Array.isArray(item.to) ? item.to : [item.to];
    return toArr.some((t) => {
      const lowerT = t.toLowerCase();
      return lowerT === targetAddress || lowerT.split('@')[0] === targetUsername;
    });
  });

  let newIngested = false;
  for (const item of matching.slice(0, 5)) {
    if (!existingResendIds.has(item.id)) {
      const full = await resend.emails.receiving.get(item.id);
      if (!full.error && full.data) {
        await ingestInboundEmail({
          resendId: full.data.id,
          from: full.data.from,
          to: full.data.to,
          subject: full.data.subject,
          text: full.data.text,
          html: full.data.html,
        });
        newIngested = true;
      }
    }
  }
  return newIngested;
}

// 1. GET: Fetch messages or check active domain (sub-10ms response)
export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    // Rate limit: max 60 requests per minute per IP for GET
    if (!checkRateLimit(getIpRateLimits, clientIp, 60, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please slow down.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const host = req.headers.get('host') || undefined;
    const resolvedDomain = await resolveTempMailDomain(host);
    const { domains, defaultDomain } = await getTempMailDomains();

    const inboxParam = searchParams.get('inbox');
    const tokenParam = searchParams.get('token') || undefined;
    const syncParam = searchParams.get('sync') === 'true';

    // If just querying domain config
    if (!inboxParam) {
      return NextResponse.json(
        {
          success: true,
          domain: resolvedDomain,
          domains,
          defaultDomain,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        }
      );
    }

    // Require matching secret token to view inbox messages
    if (!tokenParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Secret token is required to access temporary inbox messages.',
        },
        { status: 401 }
      );
    }

    // Fetch messages for active inbox immediately
    const result = await getTempInboxMessages(inboxParam, tokenParam);

    // If inbox expired or invalid token
    if (!result.inbox) {
      return NextResponse.json({
        success: false,
        error: 'Inbox has expired or does not exist.',
        expired: true,
        domain: resolvedDomain,
        domains,
        defaultDomain,
      });
    }

    const existingIds = new Set(result.messages.map((m) => m.resend_id).filter(Boolean) as string[]);

    // If user clicked manual sync/refresh, await Resend check
    if (syncParam) {
      try {
        const foundNew = await checkResendForInbox(inboxParam, existingIds);
        if (foundNew) {
          const refreshed = await getTempInboxMessages(inboxParam, tokenParam);
          return NextResponse.json(
            {
              success: true,
              domain: resolvedDomain,
              domains,
              defaultDomain,
              inbox: refreshed.inbox,
              messages: refreshed.messages,
            },
            {
              headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
              },
            }
          );
        }
      } catch {
        // non-blocking fallback
      }
    } else {
      // Non-blocking background sync so GET response returns in <10ms!
      checkResendForInbox(inboxParam, existingIds).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        domain: resolvedDomain,
        domains,
        defaultDomain,
        inbox: result.inbox,
        messages: result.messages,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch temp mail';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// 2. POST: Create a new temp inbox under your chosen domain
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    // Rate limit: max 10 inbox creations per minute per IP
    if (!checkRateLimit(postIpRateLimits, clientIp, 10, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded: too many inbox creations. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const host = req.headers.get('host') || undefined;
    const requestedDomain = body.domain && typeof body.domain === 'string' ? body.domain.trim().toLowerCase() : undefined;
    const domain = requestedDomain || (await resolveTempMailDomain(host));
    const ipHash = getClientIp(req);

    const inbox = await createTempInbox({
      username: body.username,
      domain,
      ttlSeconds: body.ttlSeconds,
      ipHash,
      previousAddress: body.previousAddress,
      previousToken: body.previousToken,
    });

    return NextResponse.json({
      success: true,
      inbox,
      message: `Temporary email created: ${inbox.address}`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create temp email';
    const status = msg.includes('Rate limit') ? 429 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

// 3. DELETE: Destroy inbox and clear all cached emails
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inbox = searchParams.get('inbox');
    const token = searchParams.get('token') || undefined;

    if (!inbox || !token) {
      return NextResponse.json({ success: false, error: 'Missing inbox address or secret token' }, { status: 400 });
    }

    await deleteTempInbox(inbox, token);

    return NextResponse.json({
      success: true,
      message: `Temporary inbox ${inbox} has been deleted.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete temp email';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
