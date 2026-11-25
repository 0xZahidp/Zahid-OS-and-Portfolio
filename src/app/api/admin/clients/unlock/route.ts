import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import { createVaultUnlockToken } from '@/lib/clients/unlock-token';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/clients/unlock
 * Verifies a 2FA step-up challenge (TOTP code via Supabase MFA, or freshly
 * completed Passkey / AAL2 session) and issues a 5-minute HMAC-signed unlock token
 * required by `/api/admin/clients/[id]/reveal`.
 */
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const { method, totpCode, accessToken } = body as {
      method?: 'totp' | 'passkey' | 'dev_bypass';
      totpCode?: string;
      accessToken?: string;
    };

    // 1. Local development bypass (strictly localhost & development)
    const isDevLocal =
      process.env.NODE_ENV === 'development' &&
      !process.env.VERCEL &&
      (req.nextUrl.hostname === 'localhost' || req.nextUrl.hostname === '127.0.0.1') &&
      req.cookies.get('folioframe_local_dev_bypass')?.value === 'true';

    if (isDevLocal && method === 'dev_bypass') {
      const { token, expiresAt } = createVaultUnlockToken('local-dev-admin', 'dev_bypass');
      return NextResponse.json({ success: true, unlockToken: token, expiresAt });
    }

    // 2. Determine user access token from body or Authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || accessToken;

    if (!bearerToken) {
      return NextResponse.json(
        { success: false, error: 'Active Supabase session token required for 2FA verification.' },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Create user-scoped Supabase client to run MFA verification against their session
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${bearerToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser(bearerToken);
    if (userErr || !userData?.user) {
      return NextResponse.json({ success: false, error: 'Invalid session token' }, { status: 401 });
    }

    // Check admin identity
    if (process.env.ADMIN_USER_ID && userData.user.id !== process.env.ADMIN_USER_ID) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (method === 'totp') {
      const cleanCode = String(totpCode || '').replace(/\s+/g, '');
      if (!/^\d{6}$/.test(cleanCode)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid 6-digit authenticator code.' },
          { status: 400 }
        );
      }

      const { data: factors, error: factorErr } = await userClient.auth.mfa.listFactors();
      if (factorErr || !factors) {
        return NextResponse.json(
          { success: false, error: 'Unable to load MFA factors.' },
          { status: 500 }
        );
      }

      const verifiedTotp =
        factors.totp.find((f) => f.status === 'verified') ||
        factors.all.find((f) => f.status === 'verified');

      if (!verifiedTotp) {
        return NextResponse.json(
          {
            success: false,
            error: 'No verified 2FA authenticator found. Enable TOTP 2FA in Settings > Security.',
          },
          { status: 400 }
        );
      }

      const { error: verifyErr } = await userClient.auth.mfa.challengeAndVerify({
        factorId: verifiedTotp.id,
        code: cleanCode,
      });

      if (verifyErr) {
        return NextResponse.json(
          { success: false, error: verifyErr.message || 'Invalid 2FA code. Please try again.' },
          { status: 401 }
        );
      }

      const { token, expiresAt } = createVaultUnlockToken(userData.user.id, 'totp');
      return NextResponse.json({ success: true, unlockToken: token, expiresAt });
    }

    if (method === 'passkey') {
      // Passkey verification happened client-side via WebAuthn; verify the resulting session is valid and matches admin
      const { data: aalData } = await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!aalData) {
        return NextResponse.json(
          { success: false, error: 'Could not verify assurance level.' },
          { status: 401 }
        );
      }
      const { token, expiresAt } = createVaultUnlockToken(userData.user.id, 'aal2');
      return NextResponse.json({ success: true, unlockToken: token, expiresAt });
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported unlock method.' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '2FA verification failed';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
