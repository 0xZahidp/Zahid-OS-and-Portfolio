'use client';

import React from 'react';
import { Sound, SoundCategory } from '@/data/sounds';
import { FocusIcon } from './FocusIcon';
import { SoundSlider } from './SoundSlider';

interface SoundCardProps {
  sound: Sound;
  category: SoundCategory;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const SoundCard: React.FC<SoundCardProps> = ({
  sound,
  category,
  volume,
  onVolumeChange,
}) => {
  const isActive = volume > 0;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl p-3.5 sm:p-4 transition-all duration-200 border bg-gradient-to-br ${
        category.bgGradient
      } ${
        isActive
          ? 'shadow-sm ring-1 ring-black/5 dark:ring-white/10 border-black/10 dark:border-white/20'
          : `${category.borderTint} hover:border-black/15 dark:hover:border-white/20`
      }`}
    >
      {/* Top row: Icon tile + Name + Subtitle */}
      <div className="flex items-start gap-2.5 min-w-0">
        <div
          className={`grid size-8 shrink-0 place-items-center rounded-xl transition-transform duration-200 ${
            isActive ? 'scale-105 shadow-xs' : 'group-hover:scale-105'
          } ${category.iconBg}`}
        >
          <FocusIcon name={sound.icon} className="size-4" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h4
            className={`truncate text-xs sm:text-sm font-semibold transition-colors ${
              isActive ? 'text-ink font-bold' : 'text-ink group-hover:text-ink'
            }`}
          >
            {sound.label}
          </h4>
          {sound.sub && (
            <p className="truncate text-[10px] text-ink-3 leading-tight mt-0.5">
              {sound.sub}
            </p>
          )}
        </div>
      </div>

      {/* Bottom row: Full-width Volume Capsule Slider */}
      <div className="mt-3">
        <SoundSlider
          volume={volume}
          onChange={onVolumeChange}
          accentClass={
            isActive
              ? 'bg-neutral-400/80 dark:bg-neutral-400/70'
              : 'bg-neutral-300/80 dark:bg-neutral-600/80'
          }
        />
      </div>
    </div>
  );
};
