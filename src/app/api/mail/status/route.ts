import { NextResponse } from 'next/server';
import { getUnreadCount } from '@/lib/mail/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    const isConfigured = Boolean(apiKey && apiKey.startsWith('re_'));
    const unreadCount = await getUnreadCount();

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
      defaultSender: 'Md Zahid Hasan <hello@zahidp.com>',
      unreadCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Status check failed';
    return NextResponse.json({ configured: false, error: msg }, { status: 500 });
  }
}

