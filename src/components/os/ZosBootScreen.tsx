'use client';

import React from 'react';
import { ZahidLogo } from '@/components/ui/ZahidLogo';

interface ZosBootScreenProps {
  isFadingOut?: boolean;
}

export const ZosBootScreen: React.FC<ZosBootScreenProps> = ({ isFadingOut = false }) => {
  return (
    <div
      className={`fixed inset-0 z-50 bg-[#090D0C]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={isFadingOut}
    >
      {/* Ambient Emerald Orb Glow */}
      <div
        className="absolute w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none -z-10 animate-pulse"
        style={{ animationDuration: '4s' }}
      />

      <div className="flex flex-col items-center gap-6 max-w-xs w-full text-center">
        {/* Zahid OS Monogram */}
        <div className="size-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/20 border border-emerald-500/30 grid place-items-center shadow-2xl shadow-emerald-950/60 transition-transform duration-300">
          <ZahidLogo className="size-9 text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
        </div>

        {/* Minimalist 4px iPadOS / macOS Progress Bar */}
        <div className="w-44 h-1 rounded-full bg-white/10 overflow-hidden relative border border-white/5 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"
            style={{
              width: '85%',
              transition: 'width 0.4s ease-out',
            }}
          />
        </div>

        {/* Monogram System Text */}
        <div className="space-y-0.5">
          <p className="text-[11px] font-mono font-medium text-emerald-300/80 tracking-wider uppercase">
            Zahid OS 18
          </p>
          <p className="text-[10px] text-white/40">
            Initialising Public Cloud Suite
          </p>
        </div>
      </div>
    </div>
  );
};
