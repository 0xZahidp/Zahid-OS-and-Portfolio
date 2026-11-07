'use client';

import React, { useState, useMemo } from 'react';
import { SOUND_CATEGORIES, SOUNDS, SoundCategory, Sound, FocusPreset } from '@/data/sounds';
import { useFocusAudio } from '@/lib/focus/useFocusAudio';
import { FocusHero } from '@/components/focus/FocusHero';
import { SoundCategoriesBar } from '@/components/focus/SoundCategoriesBar';
import { SoundCard } from '@/components/focus/SoundCard';
import { FocusMiniPlayer } from '@/components/focus/FocusMiniPlayer';
import { YouTubeSection } from '@/components/focus/YouTubeSection';
import { FocusCredits } from '@/components/focus/FocusCredits';
import { FocusIcon } from '@/components/focus/FocusIcon';

export const FocusSection: React.FC = () => {
  const {
    heroRef,
    activePreset,
    currentQuote,
    volumes,
    masterVolume,
    setMasterVolume,
    isPlaying,
    isFullscreen,
    activeSounds,
    activeSoundCount,
    setSoundVolume,
    togglePlay,
    stopAll,
    applyPreset,
    shufflePreset,
    nextQuote,
    toggleFullscreen,
  } = useFocusAudio();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  // Filter sounds based on search query
  const filteredSoundsByCategory = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const map = new Map<string, Sound[]>();

    SOUND_CATEGORIES.forEach((cat) => {
      const catSounds = SOUNDS.filter((s) => s.category === cat.id);
      if (!q) {
        map.set(cat.id, catSounds);
      } else {
        const matching = catSounds.filter(
          (s) =>
            s.label.toLowerCase().includes(q) ||
            (s.sub && s.sub.toLowerCase().includes(q)) ||
            cat.label.toLowerCase().includes(q)
        );
        if (matching.length > 0) {
          map.set(cat.id, matching);
        }
      }
    });

    return map;
  }, [searchQuery]);

  const handleSelectCategory = (catId: string) => {
    setActiveCategoryId(catId);
    const element = document.getElementById(`category-${catId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full space-y-10 pb-28 sm:pb-32">
      {/* 1. HERO SECTION */}
      <FocusHero
        heroRef={heroRef}
        activePreset={activePreset}
        currentQuote={currentQuote}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        onTogglePlay={togglePlay}
        onShuffle={shufflePreset}
        onNextQuote={nextQuote}
        onToggleFullscreen={toggleFullscreen}
        onSelectPreset={(preset: FocusPreset) => applyPreset(preset, isPlaying)}
      />

      {/* 2. SOUNDS HEADING & CATEGORY CHIPS BAR */}
      <SoundCategoriesBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategoryId={activeCategoryId}
        onSelectCategory={handleSelectCategory}
      />

      {/* 3. CATEGORIES & 4-COLUMN SOUND CARDS (4 col desktop, 3 col tablet, 2 col mobile) */}
      <div className="space-y-8">
        {SOUND_CATEGORIES.map((category: SoundCategory) => {
          const sounds = filteredSoundsByCategory.get(category.id);
          if (!sounds || sounds.length === 0) return null;

          return (
            <section
              key={category.id}
              id={`category-${category.id}`}
              className="space-y-3.5 scroll-mt-24"
            >
              {/* Category Heading with Icon Tile */}
              <div className="flex items-center gap-2">
                <span className={category.tint}>
                  <FocusIcon name={category.icon} className="size-4" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-ink">
                  {category.label}
                </h3>
              </div>

              {/* 4-Column Grid of Sound Glass Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
                {sounds.map((sound: Sound) => (
                  <SoundCard
                    key={sound.id}
                    sound={sound}
                    category={category}
                    volume={volumes[sound.id] || 0}
                    isPlaying={isPlaying}
                    onVolumeChange={(vol: number) => setSoundVolume(sound.id, vol)}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {filteredSoundsByCategory.size === 0 && (
          <div className="p-12 text-center rounded-2xl bg-surface-2 border border-line">
            <p className="text-sm font-semibold text-ink">No sounds matched &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-xs text-ink-3 mt-1">Try another keyword or clear the search field</p>
          </div>
        )}
      </div>

      {/* 4. YOUTUBE SECTION */}
      <YouTubeSection />

      {/* 5. CREDITS ACCORDION */}
      <FocusCredits />

      {/* 6. FLOATING MINI PLAYER (Visible when activeSoundCount > 0) */}
      <FocusMiniPlayer
        activePreset={activePreset}
        activeSounds={activeSounds}
        activeSoundCount={activeSoundCount}
        isPlaying={isPlaying}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
        onTogglePlay={togglePlay}
        onStopAll={stopAll}
        onToggleFullscreen={toggleFullscreen}
        onScrollToTop={() => {
          if (heroRef.current) {
            heroRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
};
