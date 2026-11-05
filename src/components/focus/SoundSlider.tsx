'use client';

import React, { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundSliderProps {
  volume: number; // 0 - 100
  onChange: (val: number) => void;
  accentClass?: string;
}

export const SoundSlider: React.FC<SoundSliderProps> = ({
  volume,
  onChange,
  accentClass = 'bg-neutral-400/80 dark:bg-neutral-500/80',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [lastNonZero, setLastNonZero] = useState<number>(50);

  const calculateFromEvent = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const width = rect.width;
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, Math.round((offsetX / width) * 100)));
    if (percentage > 0) {
      setLastNonZero(percentage);
    }
    onChange(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    calculateFromEvent(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      calculateFromEvent(moveEvent.clientX);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!e.touches[0]) return;
    calculateFromEvent(e.touches[0].clientX);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches[0]) {
        calculateFromEvent(moveEvent.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (volume > 0) {
      setLastNonZero(volume);
      onChange(0);
    } else {
      onChange(lastNonZero || 50);
    }
  };

  const isMuted = volume === 0;

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      role="slider"
      aria-valuenow={volume}
      aria-valuemin={0}
      aria-valuemax={100}
      className="group relative h-7.5 w-full cursor-pointer select-none rounded-full bg-white/70 dark:bg-black/25 border border-black/5 dark:border-white/10 overflow-hidden shadow-2xs transition-colors hover:border-black/10 dark:hover:border-white/20"
    >
      {/* Filled progress bar */}
      <div
        className={`absolute inset-y-0 left-0 transition-[width] duration-75 ${
          isMuted ? 'w-0' : accentClass
        }`}
        style={{ width: `${volume}%` }}
      />

      {/* Speaker icon & volume percentage hint */}
      <div className="relative z-10 flex h-full items-center justify-between px-2.5 pointer-events-none">
        <button
          type="button"
          onClick={toggleMute}
          className="pointer-events-auto p-0.5 rounded-full transition-transform active:scale-90"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="size-3.5 text-neutral-400 dark:text-neutral-500" />
          ) : (
            <Volume2 className="size-3.5 text-neutral-700 dark:text-neutral-200" />
          )}
        </button>

        {/* Subtle volume number on hover or active */}
        <span
          className={`font-mono text-[10px] font-semibold transition-opacity duration-150 ${
            volume > 0
              ? 'text-neutral-700 dark:text-neutral-200 opacity-80 group-hover:opacity-100'
              : 'text-neutral-400 dark:text-neutral-500 opacity-0 group-hover:opacity-60'
          }`}
        >
          {volume}%
        </span>
      </div>
    </div>
  );
};
