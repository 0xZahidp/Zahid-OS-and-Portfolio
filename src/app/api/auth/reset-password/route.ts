import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Reset Password Handler using Supabase Admin API:
 * 1. Validates the Bearer token supplied by the client (authenticated recovery session).
 * 2. Authenticates the session with Supabase via auth.getUser(token).
 * 3. Updates the user's password using the Service Role Key via admin.updateUserById(userId, { password }).
 *    - This avoids the client-side AAL2 block ('AAL2 session is required to update email or password when MFA is enabled').
 * 4. After resetting the password, the user logs in with their new password on /admin,
 *    where Supabase prompts for 2FA (AAL2) upon sign-in as expected.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: missing authentication session' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // Verify token with Supabase Auth
    const supabase = supabaseServer();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired password reset session. Please request a new link.',
        },
        { status: 401 }
      );
    }

    // Fail closed: enforce that the user recovering password is the designated admin
    const adminUserId = process.env.ADMIN_USER_ID;
    if (!adminUserId || user.id !== adminUserId.trim()) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // CSRF origin check
    const originHeader = req.headers.get('origin');
    const refererHeader = req.headers.get('referer');
    const candidate = originHeader || (refererHeader ? new URL(refererHeader).origin : null);
    if (candidate) {
      const candidateOrigin = new URL(candidate).origin;
      const reqOrigin = new URL(req.url).origin;
      if (candidateOrigin !== reqOrigin) {
        if (!process.env.NEXT_PUBLIC_SITE_URL || candidateOrigin !== new URL(process.env.NEXT_PUBLIC_SITE_URL).origin) {
          return NextResponse.json({ success: false, error: 'Invalid origin' }, { status: 403 });
        }
      }
    }

    // Update password with administrative privilege
    const { data: updateData, error: updateErr } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateErr) {
      return NextResponse.json(
        { success: false, error: updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated.',
      user: {
        id: updateData?.user?.id || user.id,
        email: updateData?.user?.email || user.email,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error updating password';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

