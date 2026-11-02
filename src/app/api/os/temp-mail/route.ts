import { NextRequest, NextResponse } from 'next/server';
import {
  createTempInbox,
  getTempInboxMessages,
  deleteTempInbox,
  resolveTempMailDomain,
  ingestInboundEmail,
} from '@/lib/os/temp-mail';
import { Resend } from 'resend';
import { getAppSecret } from '@/lib/env-vault';

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

// 1. GET: Fetch messages or check active domain
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const host = req.headers.get('host') || undefined;
    const resolvedDomain = await resolveTempMailDomain(host);

    const inboxParam = searchParams.get('inbox');
    const tokenParam = searchParams.get('token') || undefined;

    // If just querying domain config
    if (!inboxParam) {
      return NextResponse.json({
        success: true,
        domain: resolvedDomain,
      });
    }

    // Fetch messages for active inbox
    const result = await getTempInboxMessages(inboxParam, tokenParam);

    // If inbox expired or invalid token
    if (!result.inbox) {
      return NextResponse.json({
        success: false,
        error: 'Inbox has expired or does not exist.',
        expired: true,
        domain: resolvedDomain,
      });
    }

    // Optional on-demand check with Resend Receiving API if configured
    if (result.messages.length === 0) {
      try {
        const apiKey = (await getAppSecret('RESEND_API_KEY')) || process.env.RESEND_API_KEY;
        if (apiKey && apiKey.startsWith('re_')) {
          const resend = new Resend(apiKey);
          const listRes = await resend.emails.receiving.list();
          if (!listRes.error && Array.isArray(listRes.data?.data)) {
            const matching = listRes.data.data.filter((item) => {
              const toArr = Array.isArray(item.to) ? item.to : [item.to];
              return toArr.some((t) => t.toLowerCase().includes(inboxParam.toLowerCase()));
            });

            for (const item of matching.slice(0, 3)) {
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
              }
            }

            // Refresh messages if newly ingested
            if (matching.length > 0) {
              const refreshed = await getTempInboxMessages(inboxParam, tokenParam);
              return NextResponse.json({
                success: true,
                domain: resolvedDomain,
                inbox: refreshed.inbox,
                messages: refreshed.messages,
              });
            }
          }
        }
      } catch {
        // Non-blocking fallback
      }
    }

    return NextResponse.json({
      success: true,
      domain: resolvedDomain,
      inbox: result.inbox,
      messages: result.messages,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch temp mail';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// 2. POST: Create a new temp inbox under your domain
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const host = req.headers.get('host') || undefined;
    const domain = await resolveTempMailDomain(host);
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

    if (!inbox) {
      return NextResponse.json({ success: false, error: 'Missing inbox address' }, { status: 400 });
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

