import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { getClientProjectById } from '@/lib/clients/client-store';
import { verifyVaultUnlockToken } from '@/lib/clients/unlock-token';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/clients/[id]/reveal
 * Returns the client project with decrypted AES-256-GCM secrets.
 * Strictly requires a valid 5-minute 2FA `x-vault-unlock-token` header.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const unlockToken = req.headers.get('x-vault-unlock-token');
  const verifiedPayload = verifyVaultUnlockToken(unlockToken);

  if (!verifiedPayload) {
    return NextResponse.json(
      {
        success: false,
        locked: true,
        error: '2FA verification required or unlock session expired.',
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const client = await getClientProjectById(id, true);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        client,
        expiresAt: verifiedPayload.exp * 1000,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reveal client secrets';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
