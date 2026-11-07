'use client';

import React, { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SoundSliderProps {
  volume: number; // 0 - 100
  isPlaying?: boolean;
  onChange: (val: number) => void;
  accentClass?: string;
}

export const SoundSlider: React.FC<SoundSliderProps> = ({
  volume,
  isPlaying = false,
  onChange,
  accentClass,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(0, volume - 5));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(100, volume + 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(100);
    }
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

  // Active color: brand green (#0E9F6E) when playing, neutral gray when paused, or custom accent
  const fillColor = accentClass
    ? accentClass
    : isPlaying
    ? 'bg-[#0E9F6E]'
    : 'bg-[#9CA3AF] dark:bg-neutral-600';

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      role="slider"
      tabIndex={0}
      aria-valuenow={volume}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Sound volume"
      className="group relative h-[34px] w-full cursor-pointer select-none rounded-full bg-white/70 dark:bg-black/25 border border-black/5 dark:border-white/10 overflow-hidden shadow-2xs transition-colors hover:border-black/10 dark:hover:border-white/20 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
    >
      {/* Filled progress bar */}
      <div
        className={`absolute inset-y-0 left-0 transition-[width] duration-75 rounded-full ${
          isMuted ? 'w-0' : fillColor
        }`}
        style={{ width: `${volume}%` }}
      />

      {/* Speaker icon inside on the left */}
      <div className="absolute left-3 inset-y-0 z-10 flex items-center">
        <button
          type="button"
          onClick={toggleMute}
          className="p-0.5 rounded-full transition-transform active:scale-90 cursor-pointer"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="size-3.5 text-neutral-400 dark:text-neutral-500" />
          ) : (
            <Volume2
              className={`size-3.5 transition-colors ${
                volume > 15
                  ? 'text-white'
                  : 'text-neutral-600 dark:text-neutral-300'
              }`}
            />
          )}
        </button>
      </div>
    </div>
  );
};
