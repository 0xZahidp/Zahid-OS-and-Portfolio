'use client';

import React from 'react';
import Image from 'next/image';
import { Play, Pause, Shuffle, Maximize2, Minimize2, RotateCw } from 'lucide-react';
import { PRESETS, FocusPreset } from '@/data/sounds';
import { FocusIcon } from './FocusIcon';

interface FocusHeroProps {
  heroRef: React.RefObject<HTMLDivElement | null>;
  activePreset: FocusPreset;
  currentQuote: string;
  isPlaying: boolean;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onShuffle: () => void;
  onNextQuote: () => void;
  onToggleFullscreen: () => void;
  onSelectPreset: (preset: FocusPreset) => void;
}

export const FocusHero: React.FC<FocusHeroProps> = ({
  heroRef,
  activePreset,
  currentQuote,
  isPlaying,
  isFullscreen,
  onTogglePlay,
  onShuffle,
  onNextQuote,
  onToggleFullscreen,
  onSelectPreset,
}) => {
  return (
    <section
      ref={heroRef}
      aria-label="Focus sound player hero"
      className={`relative w-full overflow-hidden rounded-3xl transition-all duration-700 select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 rounded-none h-screen flex flex-col justify-end p-8 sm:p-12'
          : 'min-h-[460px] sm:min-h-[500px] flex flex-col justify-end p-6 sm:p-10 lg:p-12 shadow-sm'
      }`}
    >
      {/* Background Image with Dark Vignette & Bottom Fade */}
      <div className="absolute inset-0 -z-10 overflow-hidden bg-neutral-900">
        <Image
          src={activePreset.image}
          alt={activePreset.label}
          fill
          priority
          sizes="100vw"
          className="size-full object-cover transition-opacity duration-700 scale-105"
        />

        {/* Ambient Dark Overlay with smooth radial gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />

        {/* Bottom Fade to Page Background */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-background/40 to-background pointer-events-none" />
      </div>

      {/* Hero Content Area */}
      <div className="relative z-10 max-w-4xl space-y-4">
        {/* Tiny uppercase label */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.2em] text-white/80 font-bold drop-shadow-xs">
            READY TO PLAY
          </span>
          {isPlaying && (
            <span className="flex items-center gap-1 h-3 text-emerald-400">
              <span className="w-1 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-3.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          )}
        </div>

        {/* Huge bold title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
          {activePreset.label}
        </h1>

        {/* Italic quote with refresh button */}
        <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/85 font-medium italic drop-shadow-xs">
          <span>&ldquo; {currentQuote} &rdquo;</span>
          <button
            type="button"
            onClick={onNextQuote}
            aria-label="Next inspiring quote"
            className="p-1 rounded-full text-white/60 hover:text-white transition-transform hover:rotate-180 duration-300 cursor-pointer"
          >
            <RotateCw className="size-3.5" />
          </button>
        </div>

        {/* Action Controls: 72px green Play button + two 52px round glass buttons */}
        <div className="flex items-center gap-4 pt-2">
          {/* 72px circular vibrant green Play button */}
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause focus sounds' : 'Play focus sounds'}
            className="size-[72px] shrink-0 rounded-full bg-[#0E9F6E] hover:bg-[#0c8a5f] text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="size-8 fill-current" />
            ) : (
              <Play className="size-8 fill-current ml-1" />
            )}
          </button>

          {/* 52px round glass Shuffle button */}
          <button
            type="button"
            onClick={onShuffle}
            aria-label="Shuffle random preset"
            className="size-[52px] shrink-0 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md"
          >
            <Shuffle className="size-5" />
          </button>

          {/* 52px round glass Fullscreen button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="size-[52px] shrink-0 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all duration-200 shadow-md"
          >
            {isFullscreen ? (
              <Minimize2 className="size-5" />
            ) : (
              <Maximize2 className="size-5" />
            )}
          </button>
        </div>

        {/* Wrapped Preset Pills */}
        <div className="pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => {
              const isSelected = activePreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-md transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-white text-neutral-900 shadow-md scale-[1.03] ring-2 ring-emerald-500/40'
                      : 'bg-white/85 hover:bg-white text-neutral-800 border border-white/30 hover:scale-[1.02]'
                  }`}
                >
                  <FocusIcon
                    name={preset.icon}
                    className={`size-3.5 ${
                      isSelected ? 'text-emerald-600' : 'text-neutral-700'
                    }`}
                  />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
