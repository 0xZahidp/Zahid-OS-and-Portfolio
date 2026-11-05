import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * Verify whether the incoming request has administrative permissions.
 * Supports x-admin-key header, Bearer JWT token, and session cookies.
 */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  // 1. Direct admin key header from trusted CMS client
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey === 'folioframe_admin') {
    return true;
  }

  // 2. Supabase Bearer Auth Token
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  if (token) {
    try {
      const supabase = supabaseServer();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (!error && user) {
        return true;
      }
    } catch {
      // fallback
    }
  }

  // 3. Supabase Auth Cookie check
  try {
    const supabase = supabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (!error && user) {
      return true;
    }
  } catch {
    // fallback
  }

  return false;
}

