'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Link2Off, ArrowLeft, Home, Terminal } from 'lucide-react';

function NotFoundContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const status = searchParams.get('status');
  const isPaused = status === 'paused';

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main card */}
      <div className="card-raised rounded-3xl border border-line bg-surface p-8 sm:p-10 max-w-md w-full shadow-2xl text-center space-y-5">
        <div className="size-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 mx-auto grid place-items-center shadow-lg shadow-amber-500/10">
          <Link2Off className="size-8" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-2 border border-line text-[11px] font-mono text-ink-3 mb-2">
            <Terminal className="size-3 text-brand-500" />
            <span>Zahid OS • URL Engine</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-ink">
            {isPaused ? 'Short Link Paused' : 'Short Link Not Found'}
          </h1>

          <p className="mt-2 text-xs text-ink-3 max-w-xs mx-auto leading-relaxed">
            {isPaused ? (
              <>
                The link <code className="font-mono text-brand-500 font-semibold">/s/{slug}</code> has been temporarily deactivated by the owner.
              </>
            ) : (
              <>
                The short link <code className="font-mono text-brand-500 font-semibold">/s/{slug || 'unknown'}</code> does not exist or may have been deleted.
              </>
            )}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/"
            className="w-full sm:w-auto h-10 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 cursor-pointer"
          >
            <Home className="size-3.5" />
            <span>Visit 0xZahidP Portfolio</span>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto h-10 px-4 rounded-xl border border-line hover:bg-surface-2 text-ink-2 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShortLinkNotFoundPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="text-xs text-ink-3">Loading link status...</div>
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  );
}
