import React from 'react';
import Link from 'next/link';
import { Lock, Home, ShieldCheck, Terminal } from 'lucide-react';

export const ZahidOsPrivateGate: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="card-raised rounded-3xl border border-line bg-surface p-8 sm:p-10 max-w-md w-full shadow-2xl text-center space-y-5">
        <div className="size-16 rounded-[22%] bg-zinc-900 border border-zinc-800 text-amber-400 mx-auto grid place-items-center shadow-lg">
          <Lock className="size-8" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-2 border border-line text-[11px] font-mono text-ink-3 mb-2">
            <Terminal className="size-3 text-emerald-500" />
            <span>Zahid OS 18 • Private Mode</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-ink">
            Developer Access Only
          </h1>

          <p className="mt-2 text-xs text-ink-3 max-w-xs mx-auto leading-relaxed">
            Public access to Zahid OS is currently in private mode. Sign in to the CMS studio to enable public access and configure permissions.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/"
            className="w-full sm:w-auto h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Home className="size-3.5" />
            <span>0xZahidP Portfolio</span>
          </Link>
          <Link
            href="/admin"
            className="w-full sm:w-auto h-10 px-4 rounded-xl border border-line hover:bg-surface-2 text-ink-2 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Admin Studio</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
