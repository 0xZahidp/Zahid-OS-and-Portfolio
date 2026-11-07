'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Pause, Volume2, Link2, Maximize2, X, ChevronUp, Check } from 'lucide-react';
import { FocusPreset, Sound } from '@/data/sounds';

interface FocusMiniPlayerProps {
  activePreset: FocusPreset;
  activeSounds: Sound[];
  activeSoundCount: number;
  isPlaying: boolean;
  masterVolume: number;
  onMasterVolumeChange: (val: number) => void;
  onTogglePlay: () => void;
  onStopAll: () => void;
  onToggleFullscreen: () => void;
  onScrollToTop?: () => void;
}

export const FocusMiniPlayer: React.FC<FocusMiniPlayerProps> = ({
  activePreset,
  activeSounds,
  activeSoundCount,
  isPlaying,
  masterVolume,
  onMasterVolumeChange,
  onTogglePlay,
  onStopAll,
  onToggleFullscreen,
  onScrollToTop,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (activeSoundCount === 0) return null;

  const soundTitle =
    activeSounds.length > 0
      ? activeSounds.map((s) => s.label).join(' · ')
      : activePreset.label;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleScroll = () => {
    if (onScrollToTop) {
      onScrollToTop();
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      role="region"
      aria-label="Floating audio player"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1000px] h-16 sm:h-[68px] rounded-3xl bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-xl border border-line shadow-2xl px-3 sm:px-4 flex items-center justify-between transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Left side: Thumbnail + Titles + Expand Chevron */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* Square rounded thumbnail */}
        <div className="relative size-11 sm:size-12 rounded-xl overflow-hidden shrink-0 shadow-xs bg-neutral-900">
          <Image
            src={activePreset.image}
            alt={activePreset.label}
            fill
            sizes="48px"
            className="size-full object-cover"
          />
        </div>

        {/* Sound names + status */}
        <div className="min-w-0">
          <p
            className="truncate text-xs sm:text-sm font-semibold text-ink leading-tight max-w-[140px] sm:max-w-xs md:max-w-md"
            title={soundTitle}
          >
            {soundTitle}
          </p>
          <p className="truncate text-[11px] sm:text-xs text-ink-3 leading-tight mt-0.5">
            {activeSoundCount} {activeSoundCount === 1 ? 'sound' : 'sounds'} ·{' '}
            <span className={isPlaying ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
              {isPlaying ? 'playing' : 'paused'}
            </span>
          </p>
        </div>

        {/* Scroll up chevron */}
        <button
          type="button"
          onClick={handleScroll}
          aria-label="Scroll to top player"
          className="p-1 rounded-lg text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer shrink-0 ml-0.5"
          title="Go to hero player"
        >
          <ChevronUp className="size-4" />
        </button>
      </div>

      {/* Right side: Green volume pill + Green Play + Share + Fullscreen + Close */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Green Master Volume Pill */}
        <div className="hidden sm:flex items-center h-9 px-3 rounded-full bg-[#0E9F6E] text-white gap-2 shadow-xs">
          <Volume2 className="size-3.5 shrink-0" />
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
            className="w-16 sm:w-24 h-1.5 rounded-full appearance-none bg-emerald-800/60 cursor-pointer accent-white"
            aria-label="Master volume"
          />
        </div>

        {/* Large circular green Play/Pause button */}
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="size-10 sm:size-11 rounded-full bg-[#0E9F6E] hover:bg-[#0c8a5f] text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          {isPlaying ? (
            <Pause className="size-5 fill-current" />
          ) : (
            <Play className="size-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Share / Copy Link button */}
        <button
          type="button"
          onClick={handleShare}
          aria-label="Copy share link"
          className="size-8 sm:size-9 rounded-full bg-surface-2 hover:bg-surface-3 border border-line flex items-center justify-center text-ink-2 hover:text-ink transition-colors cursor-pointer shrink-0"
          title={copied ? 'Link copied!' : 'Copy share link'}
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Link2 className="size-4" />}
        </button>

        {/* Fullscreen button */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label="Toggle fullscreen"
          className="size-8 sm:size-9 rounded-full bg-surface-2 hover:bg-surface-3 border border-line flex items-center justify-center text-ink-2 hover:text-ink transition-colors cursor-pointer shrink-0"
          title="Toggle fullscreen"
        >
          <Maximize2 className="size-4" />
        </button>

        {/* Close (X) button */}
        <button
          type="button"
          onClick={onStopAll}
          aria-label="Close and stop all sounds"
          className="size-8 sm:size-9 rounded-full hover:bg-surface-2 flex items-center justify-center text-ink-3 hover:text-ink transition-colors cursor-pointer shrink-0"
          title="Close player"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

