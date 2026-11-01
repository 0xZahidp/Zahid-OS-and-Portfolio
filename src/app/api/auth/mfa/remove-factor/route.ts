import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Emergency / Administrative Factor Removal Handler.
 * When a user's session is at AAL1, client-side unenroll is restricted by Supabase Auth.
 * This route verifies the user's active session token, then uses the service-role client
 * to delete the factor, unsticking the user without requiring manual database edits.
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

    const body = await req.json().catch(() => ({}));
    const { factorId } = body;

    if (!factorId || typeof factorId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Factor ID is required' },
        { status: 400 }
      );
    }

    // Use service role admin API to delete the factor for this user
    const { error: delErr } = await supabase.auth.admin.mfa.deleteFactor({
      userId: user.id,
      id: factorId.trim(),
    });

    if (delErr) {
      return NextResponse.json(
        { success: false, error: delErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Factor ${factorId} successfully removed from user ${user.email}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error removing MFA factor';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

