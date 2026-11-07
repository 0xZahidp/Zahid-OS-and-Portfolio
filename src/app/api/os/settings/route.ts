import { NextRequest, NextResponse } from 'next/server';
import { getOsSettings, saveOsSettings } from '@/lib/os/settings';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getOsSettings();
    return NextResponse.json(
      { success: true, settings },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch OS settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const expectedVersion =
      typeof body.expectedVersion === 'number'
        ? body.expectedVersion
        : typeof body.version === 'number'
        ? body.version
        : undefined;
    const updated = await saveOsSettings(body, expectedVersion);
    return NextResponse.json(
      {
        success: true,
        settings: updated,
        message: 'Zahid OS settings saved successfully.',
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    const isConflict =
      (err as { status?: number })?.status === 409 ||
      (err instanceof Error && err.message.includes('changed elsewhere'));
    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This data changed elsewhere, reload before saving' },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : 'Failed to save OS settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
