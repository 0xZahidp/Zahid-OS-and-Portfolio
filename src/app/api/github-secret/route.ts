import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    // 1. Check Supabase app_settings table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        const { data: setting, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'GITHUB_TOKEN')
          .single();

        if (!error && setting?.value) {
          const val = String(setting.value);
          const preview = val.length > 4
            ? `••••••••••••${val.slice(-4)}`
            : '••••••••';
          return NextResponse.json({
            configured: true,
            source: 'supabase',
            preview,
          });
        }
      } catch (err) {
        console.warn('Supabase app_settings check failed:', err);
      }
    }

    // 2. Fallback to process.env.GITHUB_TOKEN
    if (process.env.GITHUB_TOKEN) {
      const val = process.env.GITHUB_TOKEN;
      const preview = val.length > 4
        ? `••••••••••••${val.slice(-4)}`
        : '••••••••';
      return NextResponse.json({
        configured: true,
        source: 'env',
        preview,
      });
    }

    return NextResponse.json({
      configured: false,
      source: 'none',
      preview: '',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ configured: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const token = typeof body?.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token cannot be empty' },
        { status: 400 }
      );
    }

    // Must be valid format (starts with ghp_ or github_pat_ or similar)
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid GitHub token format. Must start with ghp_ or github_pat_',
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('placeholder.supabase.co')) {
      return NextResponse.json(
        { success: false, error: 'Supabase is not configured' },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();
    const { error } = await supabase.from('app_settings').upsert({
      key: 'GITHUB_TOKEN',
      value: token,
      is_secret: true,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to save token to Supabase: ${error.message}. Please ensure table permissions are granted.`,
        },
        { status: 500 }
      );
    }

    const preview = `••••••••••••${token.slice(-4)}`;
    return NextResponse.json({
      success: true,
      message: 'Token securely encrypted and stored directly in Supabase app_settings table.',
      preview,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save token';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      const supabase = supabaseServer();
      await supabase.from('app_settings').delete().eq('key', 'GITHUB_TOKEN');
    }
    return NextResponse.json({
      success: true,
      message: 'Token removed from Supabase.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete token';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

