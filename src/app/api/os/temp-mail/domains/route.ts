import { NextRequest, NextResponse } from 'next/server';
import {
  getTempMailDomains,
  addTempMailDomain,
  removeTempMailDomain,
  setDefaultTempMailDomain,
  syncDomainFromResend,
} from '@/lib/os/temp-mail-domains';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { domains, defaultDomain } = await getTempMailDomains();
    return NextResponse.json({
      success: true,
      domains,
      defaultDomain,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch temp mail domains';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const { domain, resendApiKey, isDefault, action } = body;

    if (!domain) {
      return NextResponse.json({ success: false, error: 'Domain name is required.' }, { status: 400 });
    }

    if (action === 'sync' || action === 'verify') {
      const syncResult = await syncDomainFromResend(domain);
      if (!syncResult.success) {
        return NextResponse.json({ success: false, error: syncResult.error }, { status: 400 });
      }
      const mxRecord = syncResult.domain?.dnsRecords?.find((r) => r.type === 'MX');
      const isMxVerified = mxRecord?.status === 'verified';
      return NextResponse.json({
        success: true,
        domain: syncResult.domain,
        dnsRecords: syncResult.domain?.dnsRecords,
        resendVerified: syncResult.domain?.status === 'verified',
        isReceivingReady: isMxVerified,
        message: isMxVerified
          ? `Domain '${domain}' is fully verified and ready to receive inbound temp emails!`
          : `Checked Resend: Inbound MX record is still pending in DNS. Please add the MX record in Spaceship/DNS manager.`,
      });
    }

    const result = await addTempMailDomain({
      domain,
      resendApiKey,
      isDefault,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      domain: result.domain,
      dnsRecords: result.dnsRecords,
      resendVerified: result.resendVerified,
      message: `Domain '${result.domain?.domain}' registered in Temp Mail system.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to add temp mail domain';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const domainQuery = searchParams.get('domain') || searchParams.get('id');

    let target = domainQuery;
    if (!target) {
      const body = await req.json().catch(() => ({}));
      target = body.domain || body.id;
    }

    if (!target) {
      return NextResponse.json({ success: false, error: 'Domain name or ID is required.' }, { status: 400 });
    }

    const removed = await removeTempMailDomain(target);
    if (!removed) {
      return NextResponse.json({ success: false, error: 'Domain not found or could not be removed.' }, { status: 404 });
    }

    const { domains, defaultDomain } = await getTempMailDomains();
    return NextResponse.json({
      success: true,
      message: `Domain '${target}' removed.`,
      domains,
      defaultDomain,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete temp mail domain';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { domain, isDefault } = body;

    if (!domain) {
      return NextResponse.json({ success: false, error: 'Domain is required.' }, { status: 400 });
    }

    if (isDefault) {
      await setDefaultTempMailDomain(domain);
    }

    const { domains, defaultDomain } = await getTempMailDomains();
    return NextResponse.json({
      success: true,
      domains,
      defaultDomain,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update temp mail domain';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

