'use client';

import React, { useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { SOUND_CATEGORIES, SoundCategory } from '@/data/sounds';
import { FocusIcon } from './FocusIcon';

interface SoundCategoriesBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategoryId: string | null;
  onSelectCategory: (id: string) => void;
}

export const SoundCategoriesBar: React.FC<SoundCategoriesBarProps> = ({
  searchQuery,
  onSearchChange,
  activeCategoryId,
  onSelectCategory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {/* Heading & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
          Sounds
        </h2>

        {/* Search input with search icon */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search sounds"
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-2 border border-line text-xs font-medium text-ink placeholder:text-ink-4 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-3 hover:text-ink cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Horizontally Scrollable Category Chips with Right Fade & Arrow */}
      <div className="relative flex items-center">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 pr-14 w-full"
        >
          {SOUND_CATEGORIES.map((cat: SoundCategory) => {
            const isSelected = activeCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold border transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer shadow-2xs whitespace-nowrap ${
                  isSelected
                    ? 'bg-surface border-line-strong text-ink shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                    : 'bg-surface-2 border-line text-ink-2 hover:text-ink hover:bg-surface hover:border-line-strong'
                }`}
              >
                <span className={cat.tint}>
                  <FocusIcon name={cat.icon} className="size-3.5" />
                </span>
                <span>{cat.label}</span>
                <span className="font-mono text-[11px] opacity-60">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right fade mask gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-surface via-surface/85 to-transparent pointer-events-none z-5" />

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={scrollRight}
          aria-label="Scroll categories right"
          className="absolute right-0 top-1/2 -translate-y-1/2 size-8 rounded-full bg-surface border border-line shadow-xs flex items-center justify-center text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer shrink-0 z-10"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
};
