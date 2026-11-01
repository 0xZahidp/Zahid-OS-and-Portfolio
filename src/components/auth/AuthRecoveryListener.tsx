'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * Global listener that intercepts Supabase recovery tokens / password reset flows.
 * If a user clicks a reset link that redirects to http://localhost:3000 (or any page)
 * with `#access_token=...&type=recovery` or `?type=recovery`, this automatically
 * routes them to `/admin/reset-password` preserving their credentials.
 */
export function AuthRecoveryListener() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    if (pathname.startsWith('/admin/reset-password') || pathname.startsWith('/reset-password')) {
      return;
    }

    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // 1. Detect recovery in URL hash or query params
    const hasRecoveryToken =
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      (hash.includes('access_token=') && hash.includes('recovery')) ||
      hash.includes('error_code=otp_expired') ||
      search.includes('error_code=otp_expired');

    if (hasRecoveryToken) {
      window.location.replace(`/admin/reset-password${search}${hash}`);
      return;
    }

    // 2. Listen for Supabase PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/admin/reset-password') && !currentPath.startsWith('/reset-password')) {
          const currentHash = window.location.hash || '';
          const currentSearch = window.location.search || '';
          window.location.replace(`/admin/reset-password${currentSearch}${currentHash}`);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
