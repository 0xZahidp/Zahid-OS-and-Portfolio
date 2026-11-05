'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  FOCUS_PRESETS,
  FOCUS_CATEGORIES,
  FOCUS_SOUNDS,
  FOCUS_SCENES,
  FOCUS_QUOTES,
  FocusPreset,
  FocusSound,
  FocusCategory,
} from '@/data/focus-data';
import { getFocusAudioEngine } from '@/lib/focus/audio-engine';
import { YouTubeSection } from '@/components/focus/YouTubeSection';
import * as LucideIcons from 'lucide-react';
import {
  Play,
  Pause,
  Shuffle,
  Maximize2,
  Minimize2,
  RotateCw,
  Volume2,
  VolumeX,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  RotateCcw,
} from 'lucide-react';

// Dynamic icon resolver for Lucide icons
const FocusIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'size-4' }) => {
  const IconComponent = (LucideIcons as unknown as Record<string, React.FC<{ className?: string }>>)[name] || LucideIcons.Activity;
  return <IconComponent className={className} />;
};

export const FocusSection: React.FC = () => {
  const engine = useMemo(() => getFocusAudioEngine(), []);

  // UI state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activePresetSlug, setActivePresetSlug] = useState<string>('forest-walk');
  const [currentScene, setCurrentScene] = useState<string>('forest');
  const [quoteIdx, setQuoteIdx] = useState<number>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreditsOpen, setIsCreditsOpen] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Volumes state snapshot to trigger re-renders
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  // Subscribe to audio engine state changes
  useEffect(() => {
    const updateState = () => {
      setIsPlaying(engine.getIsPlaying());
      setVolumes(engine.getAllVolumes());
    };

    updateState();
    const unsubscribe = engine.subscribe(updateState);
    return () => unsubscribe();
  }, [engine]);

  // Live time ticker for Zen mode
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle escape key to exit Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode]);

  // Master Play / Pause
  const handleTogglePlay = () => {
    engine.togglePlayPause();
  };

  // Select Preset
  const handleSelectPreset = (preset: FocusPreset) => {
    setActivePresetSlug(preset.slug);
    setCurrentScene(preset.scene);
    engine.applyPreset(preset.slug);
  };

  // Shuffle / Randomize Preset
  const handleShuffle = () => {
    const remaining = FOCUS_PRESETS.filter((p) => p.slug !== activePresetSlug);
    const randomPreset = remaining[Math.floor(Math.random() * remaining.length)];
    if (randomPreset) {
      handleSelectPreset(randomPreset);
    }
  };

  // Cycle Quote
  const handleNextQuote = () => {
    setQuoteIdx((prev) => (prev + 1) % FOCUS_QUOTES.length);
  };

  // Adjust individual sound volume
  const handleVolumeChange = (slug: string, value: number) => {
    engine.setVolume(slug, value);
  };

  // Toggle individual sound mute / unmute
  const handleToggleSound = (slug: string) => {
    const current = engine.getVolume(slug);
    if (current > 0) {
      engine.setVolume(slug, 0);
    } else {
      engine.setVolume(slug, 0.6);
    }
  };

  // Reset all sounds
  const handleResetAll = () => {
    engine.resetAll();
    setActivePresetSlug('');
  };

  // Filtered sounds list
  const filteredSounds = useMemo(() => {
    let list = FOCUS_SOUNDS;

    if (activeCategory !== 'all') {
      list = list.filter((s) => s.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) => s.name.toLowerCase().includes(q) || (s.sub && s.sub.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeCategory, searchQuery]);

  // Current active preset object
  const currentPreset = useMemo(() => {
    return FOCUS_PRESETS.find((p) => p.slug === activePresetSlug) || FOCUS_PRESETS[0];
  }, [activePresetSlug]);

  // Scene background image
  const sceneInfo = FOCUS_SCENES[currentScene] || FOCUS_SCENES.forest;

  return (
    <div className="w-full space-y-10 pb-16 selection:bg-brand-500 selection:text-white">
      {/* 1. HERO CARD BANNER */}
      <section
        className="relative overflow-hidden rounded-3xl bg-surface-3 shadow-md border border-line min-h-[380px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-10 lg:p-12 transition-all duration-700"
        aria-label="Focus ambient player"
      >
        {/* Background scene image with smooth crossfade */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <Image
            src={sceneInfo.image}
            alt={sceneInfo.alt}
            fill
            priority
            sizes="100vw"
            className="size-full object-cover transition-opacity duration-700"
          />
          {/* Subtle gradient vignette to ensure text contrast and seamlessly fade into content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/25" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 space-y-6 max-w-4xl text-white">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-mono tracking-wider uppercase text-white/90">
              <span
                className={`size-2 rounded-full ${
                  isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-white/50'
                }`}
              />
              <span>{isPlaying ? 'Playing' : 'Ready to play'}</span>
              {isPlaying && (
                <span className="flex items-center gap-0.5 h-2.5 ml-1 text-emerald-400">
                  <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-0.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-md text-white">
            {currentPreset.label}
          </h1>

          {/* Quote with cycle button */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-white/80 font-medium">
            <span className="text-base sm:text-lg text-white/60 font-serif">“</span>
            <span className="italic">{FOCUS_QUOTES[quoteIdx]}</span>
            <span className="text-base sm:text-lg text-white/60 font-serif">”</span>
            <button
              type="button"
              onClick={handleNextQuote}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Change quote"
              aria-label="Refresh quote"
            >
              <RotateCw className="size-3.5" />
            </button>
          </div>

          {/* Action row: Play/Pause, Shuffle, Fullscreen Zen */}
          <div className="flex items-center gap-3 pt-2">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="size-13 sm:size-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black grid place-items-center shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer font-bold"
              aria-label={isPlaying ? 'Pause focus sounds' : 'Play focus sounds'}
            >
              {isPlaying ? (
                <Pause className="size-6 fill-current text-black" />
              ) : (
                <Play className="size-6 fill-current text-black ml-0.5" />
              )}
            </button>

            {/* Shuffle Button */}
            <button
              type="button"
              onClick={handleShuffle}
              className="size-10 sm:size-11 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/15 text-white/90 hover:text-white grid place-items-center transition-all cursor-pointer backdrop-blur-md"
              title="Shuffle ambient preset"
              aria-label="Shuffle preset"
            >
              <Shuffle className="size-4" />
            </button>

            {/* Fullscreen Zen Mode Button */}
            <button
              type="button"
              onClick={() => setIsZenMode(true)}
              className="size-10 sm:size-11 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/15 text-white/90 hover:text-white grid place-items-center transition-all cursor-pointer backdrop-blur-md"
              title="Zen Fullscreen mode"
              aria-label="Fullscreen zen mode"
            >
              <Maximize2 className="size-4" />
            </button>
          </div>

          {/* 12 Presets Pill Scroller */}
          <div className="pt-4 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2 flex-nowrap sm:flex-wrap">
              {FOCUS_PRESETS.map((preset) => {
                const isActive = activePresetSlug === preset.slug;
                return (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-tight transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-white text-black font-bold shadow-md scale-102'
                        : 'bg-black/40 hover:bg-black/60 text-white/90 hover:text-white border border-white/15 backdrop-blur-md'
                    }`}
                  >
                    <FocusIcon
                      name={preset.iconName}
                      className={`size-3.5 ${isActive ? 'text-black' : 'text-white/80'}`}
                    />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. SOUNDS MIXER SECTION */}
      <section className="space-y-6" aria-labelledby="focus-sounds-heading">
        {/* Sounds Section Header: Title, Search, and Active count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 id="focus-sounds-heading" className="text-xl font-bold tracking-tight text-ink">
              Sounds
            </h2>
            {engine.getActiveSoundsCount() > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-mono font-semibold text-brand-600 dark:text-brand-400">
                <span className="size-1.5 rounded-full bg-brand-500 animate-ping" />
                <span>{engine.getActiveSoundsCount()} active</span>
              </span>
            )}
            {engine.getActiveSoundsCount() > 0 && (
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-ink-3 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1"
                title="Mute and reset all active sounds"
              >
                <RotateCcw className="size-3" />
                <span>Reset all</span>
              </button>
            )}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-ink-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sounds"
              className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-surface-2 border border-line text-xs text-ink placeholder:text-ink-3 focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-3 hover:text-ink cursor-pointer px-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="overflow-x-auto no-scrollbar pb-1">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-ink text-surface shadow-xs'
                  : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink border border-line'
              }`}
            >
              <span>All</span>
              <span className="ml-1.5 text-[10px] opacity-70">({FOCUS_SOUNDS.length})</span>
            </button>

            {FOCUS_CATEGORIES.map((cat) => {
              const count = FOCUS_SOUNDS.filter((s) => s.category === cat.id).length;
              const isActive = activeCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-ink text-surface shadow-xs'
                      : 'bg-surface-2 text-ink-2 hover:bg-surface-3 hover:text-ink border border-line'
                  }`}
                >
                  <FocusIcon name={cat.iconName} className="size-3.5" />
                  <span>{cat.label}</span>
                  <span className="text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound Cards Responsive Grid */}
        {activeCategory === 'all' && !searchQuery.trim() ? (
          // Grouped by Category View (Identical to nahian.bd)
          <div className="space-y-8">
            {FOCUS_CATEGORIES.map((cat) => {
              const catSounds = FOCUS_SOUNDS.filter((s) => s.category === cat.id);
              if (catSounds.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-2">
                    <FocusIcon name={cat.iconName} className="size-4 text-brand-500" />
                    <h3 className="text-sm font-bold tracking-tight text-ink">
                      {cat.label}
                    </h3>
                  </div>

                  {/* Category Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {catSounds.map((sound) => (
                      <SoundTile
                        key={sound.slug}
                        sound={sound}
                        category={cat}
                        volume={volumes[sound.slug] || 0}
                        onVolumeChange={(val) => handleVolumeChange(sound.slug, val)}
                        onToggleSound={() => handleToggleSound(sound.slug)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Filtered Grid View (when searching or category selected)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredSounds.map((sound) => {
              const cat = FOCUS_CATEGORIES.find((c) => c.id === sound.category) || FOCUS_CATEGORIES[0];
              return (
                <SoundTile
                  key={sound.slug}
                  sound={sound}
                  category={cat}
                  volume={volumes[sound.slug] || 0}
                  onVolumeChange={(val) => handleVolumeChange(sound.slug, val)}
                  onToggleSound={() => handleToggleSound(sound.slug)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 3. YOUTUBE SECTION */}
      <YouTubeSection />

      {/* 4. CREDITS ACCORDION */}
      <section className="rounded-2xl border border-line bg-surface-2 overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsCreditsOpen(!isCreditsOpen)}
          className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-semibold text-ink cursor-pointer hover:bg-surface-3/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="size-4 text-ink-3" />
            <span>Credits</span>
          </div>
          {isCreditsOpen ? (
            <ChevronUp className="size-4 text-ink-3" />
          ) : (
            <ChevronDown className="size-4 text-ink-3" />
          )}
        </button>

        {isCreditsOpen && (
          <div className="px-5 pb-5 pt-1 space-y-2 text-xs text-ink-3 leading-relaxed border-t border-line/60">
            <p>
              52 recordings come from{' '}
              <a
                href="https://github.com/remvze/moodist"
                target="_blank"
                rel="noopener noreferrer"
                className="text-link font-medium hover:underline"
              >
                Moodist
              </a>
              , an open-source ambient sound app by remvze. Its sounds are under the Pixabay License
              or CC0. Thank you!
            </p>
            <p>
              <strong>Tin roof:</strong> Rain on Tin Roof - 1 Hour by archerjosiah · CC0
            </p>
            <p>
              <strong>Forest:</strong> Woods ambience in Missouri, some birds singing and soft breeze
              by felix.blume · CC0
            </p>
          </div>
        )}
      </section>

      {/* 5. FULLSCREEN ZEN FOCUS MODE */}
      {isZenMode && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-300">
          {/* Zen Background image */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <Image
              src={sceneInfo.image}
              alt={sceneInfo.alt}
              fill
              priority
              sizes="100vw"
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          </div>

          {/* Top Bar: Title & Exit */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono tracking-wider uppercase text-white/70">
                Zen Mode
              </span>
              <span className="text-white/40">•</span>
              <span className="text-sm font-bold text-white">{currentPreset.label}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsZenMode(false)}
              className="size-10 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-all cursor-pointer backdrop-blur-md"
              title="Exit Zen mode (Esc)"
            >
              <Minimize2 className="size-4" />
            </button>
          </div>

          {/* Centerpiece: Huge Time & Quote */}
          <div className="text-center space-y-4 max-w-2xl mx-auto z-10">
            <div className="text-6xl sm:text-8xl lg:text-9xl font-mono font-bold tracking-tight text-white/95 drop-shadow-lg">
              {currentTimeStr}
            </div>

            <p className="text-sm sm:text-lg text-white/80 font-medium italic">
              “{FOCUS_QUOTES[quoteIdx]}”
            </p>
          </div>

          {/* Bottom Bar: Ambient Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="size-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black grid place-items-center shadow-lg transition-transform active:scale-95 cursor-pointer font-bold"
              >
                {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleShuffle}
                className="size-10 rounded-xl bg-white/10 hover:bg-white/20 text-white grid place-items-center transition-all cursor-pointer backdrop-blur-md"
                title="Shuffle preset"
              >
                <Shuffle className="size-4" />
              </button>
            </div>

            <div className="text-xs text-white/60 font-mono">
              Press <kbd className="px-1.5 py-0.5 rounded-md bg-white/10 text-white">Esc</kbd> to return
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Individual Sound Card with Volume Capsule
interface SoundTileProps {
  sound: FocusSound;
  category: FocusCategory;
  volume: number;
  onVolumeChange: (val: number) => void;
  onToggleSound: () => void;
}

const SoundTile: React.FC<SoundTileProps> = ({
  sound,
  category,
  volume,
  onVolumeChange,
  onToggleSound,
}) => {
  const isActive = volume > 0;

  return (
    <div
      className={`group relative p-3.5 rounded-2xl border transition-all select-none space-y-3 ${
        isActive
          ? 'bg-surface border-brand-500/40 shadow-xs ring-1 ring-brand-500/20'
          : 'bg-surface-2 hover:bg-surface-3/70 border-line hover:border-line-strong'
      }`}
    >
      {/* Subtle background glow tint for active category */}
      {isActive && (
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${category.tint} pointer-events-none -z-10 opacity-70`}
        />
      )}

      {/* Top Row: Icon + Sound Name + Subtitle */}
      <div
        className="flex items-start gap-2.5 cursor-pointer"
        onClick={onToggleSound}
        title={isActive ? 'Click to mute' : 'Click to play'}
      >
        <div
          className={`size-8 rounded-xl grid place-items-center transition-colors shrink-0 ${
            isActive
              ? 'bg-brand-500 text-white shadow-xs'
              : 'bg-surface-3 text-ink-3 group-hover:text-ink'
          }`}
        >
          <FocusIcon name={sound.iconName} className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-xs font-semibold transition-colors ${
              isActive ? 'text-ink font-bold' : 'text-ink-2 group-hover:text-ink'
            }`}
          >
            {sound.name}
          </span>
          {sound.sub && (
            <span className="block truncate text-[10px] text-ink-3 leading-tight">
              {sound.sub}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Volume Slider Capsule */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={onToggleSound}
          className={`size-6 rounded-md grid place-items-center transition-colors cursor-pointer shrink-0 ${
            isActive ? 'text-brand-500 hover:text-brand-600' : 'text-ink-3 hover:text-ink'
          }`}
          title={isActive ? 'Mute' : 'Turn on'}
        >
          {isActive ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
        </button>

        {/* Custom slider track */}
        <div className="relative flex-1 flex items-center h-5">
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(volume * 100)}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            className="w-full h-1.5 rounded-full appearance-none bg-surface-3/80 cursor-pointer accent-brand-500 hover:accent-brand-600 transition-all"
            aria-label={`${sound.name} volume`}
          />
        </div>

        {isActive && (
          <span className="text-[10px] font-mono text-ink-3 w-6 text-right shrink-0">
            {Math.round(volume * 100)}%
          </span>
        )}
      </div>
    </div>
  );
};
