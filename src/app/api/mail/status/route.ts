import { NextRequest, NextResponse } from 'next/server';
import { getUnreadCount } from '@/lib/mail/store';
import { getAppSecret, setAppSecret } from '@/lib/env-vault';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const apiKey = await getAppSecret('RESEND_API_KEY');
    const isConfigured = Boolean(apiKey && apiKey.startsWith('re_'));
    const unreadCount = await getUnreadCount();

    const configuredSender =
      (await getAppSecret('RESEND_DEFAULT_SENDER')) ||
      (await getAppSecret('CONTACT_FROM_EMAIL')) ||
      process.env.RESEND_DEFAULT_SENDER ||
      process.env.CONTACT_FROM_EMAIL ||
      'Md Zahid Hasan <hello@zahidp.com>';

    let domainStatus = 'unknown';
    let verifiedDomain = 'zahidp.com';

    if (isConfigured && apiKey) {
      try {
        const res = await fetch('https://api.resend.com/domains', {
          headers: { Authorization: `Bearer ${apiKey}` },
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const data = await res.json();
          const found = data.data?.find((d: { name: string }) => d.name === 'zahidp.com');
          if (found) {
            domainStatus = found.status;
            verifiedDomain = found.name;
          }
        }
      } catch {
        domainStatus = 'unreachable';
      }
    }

    return NextResponse.json({
      configured: isConfigured,
      verifiedDomain,
      domainStatus,
      defaultSender: configuredSender,
      unreadCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Status check failed';
    return NextResponse.json({ configured: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { defaultSender } = body;

    if (!defaultSender || typeof defaultSender !== 'string') {
      return NextResponse.json({ success: false, error: 'defaultSender is required' }, { status: 400 });
    }

    const cleanSender = defaultSender.trim();
    const result = await setAppSecret(
      'RESEND_DEFAULT_SENDER',
      cleanSender,
      false,
      'Default sender address for emails dispatched by Resend'
    );

    // Keep CONTACT_FROM_EMAIL synced as well
    await setAppSecret(
      'CONTACT_FROM_EMAIL',
      cleanSender,
      false,
      'Sender header for emails dispatched by Resend'
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        defaultSender: cleanSender,
        message: 'Default sender address successfully updated in Supabase.',
      });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Failed to update sender' }, { status: 500 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update sender address';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
