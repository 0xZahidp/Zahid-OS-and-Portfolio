import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Safely decodes a JWT payload without external library dependencies
 */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * SECURED Administrative Factor Removal Handler:
 * 1. Decode session JWT and read the `aal` claim.
 * 2. Authenticate session with Supabase auth.getUser(token).
 * 3. Verify the factor belongs to the authenticated user.
 * 4. If the factor is verified (or user has verified factors), require aal === 'aal2', otherwise return 403.
 * 5. At AAL1, only allow removing factors with status 'unverified'.
 * 6. Always verify the factor belongs to the authenticated user before calling the admin API.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing access token' },
        { status: 401 }
      );
    }

    // Decode session JWT and read the `aal` claim
    const payload = decodeJwt(token);
    const sessionAal = (payload?.aal as string) || 'aal1';

    // Verify token with Supabase Auth
    const supabase = supabaseServer();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired authentication session' },
        { status: 401 }
      );
    }

    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId || user.id !== adminUserId.trim()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { factorId } = body;

    if (!factorId || typeof factorId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Factor ID is required' },
        { status: 400 }
      );
    }

    // Always verify the factor belongs to the authenticated user before calling the admin API
    const { data: factorsData, error: factorsErr } = await supabase.auth.admin.mfa.listFactors({
      userId: user.id,
    });

    if (factorsErr) {
      return NextResponse.json(
        { success: false, error: factorsErr.message },
        { status: 500 }
      );
    }

    const userFactors = factorsData?.factors || [];
    const targetFactor = userFactors.find((f) => f.id === factorId.trim());

    if (!targetFactor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Factor not found or does not belong to the authenticated user.',
        },
        { status: 404 }
      );
    }

    // Security Gate:
    // If the user has any verified factor or target factor is verified, require aal === 'aal2', otherwise return 403.
    // At AAL1, only allow removing factors with status 'unverified'.
    if (sessionAal !== 'aal2') {
      if (targetFactor.status !== 'unverified') {
        return NextResponse.json(
          {
            success: false,
            error:
              'AAL2 session required to remove a verified authentication factor. Please verify your 2FA code, or delete the factor from the Supabase Dashboard (Authentication -> Users -> Factors).',
          },
          { status: 403 }
        );
      }
    }

    // Proceed to delete factor using service-role client
    const { error: delErr } = await supabase.auth.admin.mfa.deleteFactor({
      userId: user.id,
      id: targetFactor.id,
    });

    if (delErr) {
      return NextResponse.json(
        { success: false, error: delErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Factor ${targetFactor.id} (${targetFactor.friendly_name || targetFactor.factor_type}) successfully removed.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error removing MFA factor';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
