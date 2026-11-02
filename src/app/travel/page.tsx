import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { TravelWorkspace } from '@/components/travel/TravelWorkspace';
import { ArrowLeft, Terminal, Home } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bangladesh Travel Map • 0xZahidP',
  description: 'Interactive 64-district geographical journey and travel ledger across Bangladesh by 0xZahidP.',
  openGraph: {
    title: 'Bangladesh Travel Map • 0xZahidP',
    description: 'Explore 0xZahidP’s travel journey, visited districts, road trips, and wishlist across all 8 divisions of Bangladesh.',
  },
};

export default function StandaloneTravelPage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">
      {/* Background radial glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-600/15 via-teal-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white/80 hover:text-white transition-colors group cursor-pointer"
          >
            <div className="size-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 grid place-items-center group-hover:scale-105 transition-transform">
              <ArrowLeft className="size-3.5" />
            </div>
            <span className="text-xs font-bold tracking-tight">0xZahidP</span>
            <span className="text-xs text-white/40">/</span>
            <span className="text-xs text-emerald-400 font-mono">travel</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/os"
              className="h-8 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Terminal className="size-3.5 text-emerald-400" />
              <span>Zahid OS</span>
            </Link>

            <Link
              href="/"
              className="h-8 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
            >
              <Home className="size-3.5" />
              <span>Portfolio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="py-6 sm:py-10 px-3 sm:px-6">
        <TravelWorkspace mode="public" />
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-white/40 space-y-1">
        <p>Curated Bangladesh travel ledger & interactive SVG map engine by 0xZahidP.</p>
        <p className="font-mono text-[11px] text-white/30">
          Built with Next.js 15, React 19, TypeScript, and SVG Mercator coordinates.
        </p>
      </footer>
    </main>
  );
}
