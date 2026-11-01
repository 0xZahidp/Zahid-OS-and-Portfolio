import { NextRequest, NextResponse } from 'next/server';
import { listAppSecrets, setAppSecret, deleteAppSecret } from '@/lib/env-vault';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await listAppSecrets();
    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list secrets';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, isSecret = true, description = '' } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ success: false, error: 'Variable key is required' }, { status: 400 });
    }

    if (value === undefined || value === null) {
      return NextResponse.json({ success: false, error: 'Variable value is required' }, { status: 400 });
    }

    const cleanKey = key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const result = await setAppSecret(cleanKey, String(value).trim(), Boolean(isSecret), description);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Variable '${cleanKey}' successfully saved to Supabase (No Vercel deployment needed).`,
        key: cleanKey,
      });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Failed to save secret' }, { status: 500 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let key = searchParams.get('key');

    if (!key) {
      const body = await req.json().catch(() => ({}));
      key = body.key;
    }

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key parameter is required' }, { status: 400 });
    }

    const result = await deleteAppSecret(key);
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Variable '${key}' removed from Supabase.`,
      });
    } else {
      return NextResponse.json({ success: false, error: result.error || 'Failed to delete' }, { status: 500 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

