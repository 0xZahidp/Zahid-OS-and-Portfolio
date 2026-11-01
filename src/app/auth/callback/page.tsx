'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isSubscribed = true;

    async function handleAuth() {
      try {
        const type = searchParams.get('type');
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        const isRecovery = type === 'recovery' || hash.includes('type=recovery');
        const defaultNext = isRecovery ? '/admin/reset-password' : '/admin';
        const next = searchParams.get('next') || defaultNext;
        const code = searchParams.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        } else {
          // If using implicit hash fragment, getSession automatically extracts it
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }
          if (!data?.session) {
            // Wait briefly for Supabase to finish parsing hash if any
            await new Promise((r) => setTimeout(r, 600));
          }
        }

        if (isSubscribed) {
          setStatus('success');
          setTimeout(() => {
            const finalDestination = isRecovery && hash ? `/admin/reset-password${hash}` : next;
            router.replace(finalDestination);
          }, 400);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Authentication verification failed');
        }
      }
    }

    handleAuth();

    return () => {
      isSubscribed = false;
    };
  }, [router, searchParams]);

  return (
    <div className="card-raised rounded-3xl border border-line bg-surface p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
      {status === 'loading' && (
        <>
          <div className="size-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 mx-auto grid place-items-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
          <h2 className="text-base font-bold text-ink">Authenticating...</h2>
          <p className="text-xs text-ink-3">Verifying your Google credentials with Supabase.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto grid place-items-center">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="text-base font-bold text-ink">Success!</h2>
          <p className="text-xs text-ink-3">Redirecting to FolioFrame CMS Studio...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 mx-auto grid place-items-center">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-base font-bold text-ink">Authentication Error</h2>
          <p className="text-xs text-rose-500">{errorMessage}</p>
          <button
            type="button"
            onClick={() => router.replace('/admin')}
            className="mt-3 btn btn-secondary h-9 px-4 rounded-xl text-xs font-semibold w-full"
          >
            Back to Login
          </button>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="card-raised rounded-3xl border border-line bg-surface p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="size-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 mx-auto grid place-items-center">
              <Loader2 className="size-6 animate-spin" />
            </div>
            <h2 className="text-base font-bold text-ink">Loading...</h2>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
