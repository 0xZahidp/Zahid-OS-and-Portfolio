'use client';

import React from 'react';
import { Sound, SoundCategory } from '@/data/sounds';
import { FocusIcon } from './FocusIcon';
import { SoundSlider } from './SoundSlider';

interface SoundCardProps {
  sound: Sound;
  category: SoundCategory;
  volume: number;
  isPlaying?: boolean;
  onVolumeChange: (vol: number) => void;
}

export const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  category,
  volume,
  isPlaying = false,
  onVolumeChange,
}) => {
  const isActive = volume > 0;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl p-3 sm:p-3.5 transition-all duration-200 border bg-gradient-to-br ${
        category.bgGradient
      } ${
        isActive
          ? 'shadow-xs border-black/15 dark:border-white/20'
          : `${category.borderTint} hover:border-black/15 dark:hover:border-white/20`
      }`}
    >
      {/* Top row: ~32px rounded-square white/translucent icon tile + 14px medium sound name */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`grid size-8 shrink-0 place-items-center rounded-xl bg-white/80 dark:bg-white/10 shadow-2xs transition-transform duration-200 ${
            isActive ? 'scale-105' : 'group-hover:scale-105'
          }`}
        >
          <span className={category.tint}>
            <FocusIcon name={sound.icon} className="size-4" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xs sm:text-sm font-medium text-ink leading-tight">
            {sound.label}
          </h4>
        </div>
      </div>

      {/* Bottom row: ~34px pill volume slider */}
      <div className="mt-2.5">
        <SoundSlider
          volume={volume}
          isPlaying={isPlaying}
          onChange={onVolumeChange}
        />
      </div>
    </div>
  );
};
