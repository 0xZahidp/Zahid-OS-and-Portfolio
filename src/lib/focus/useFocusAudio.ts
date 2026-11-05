'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SOUNDS, PRESETS, FOCUS_QUOTES, FocusPreset } from '@/data/sounds';

const STORAGE_KEY = 'folioframe_focus_audio_state';

interface SavedState {
  presetId: string;
  volumes: Record<string, number>;
  isPlaying: boolean;
}

export function useFocusAudio() {
  const [currentPresetId, setCurrentPresetId] = useState<string>('forest-walk');
  const [volumes, setVolumes] = useState<Record<string, number>>(() => {
    const forest = PRESETS.find((p) => p.id === 'forest-walk') || PRESETS[0];
    return { ...forest.sounds };
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const heroRef = useRef<HTMLDivElement>(null);
  const isHydratedRef = useRef<boolean>(false);

  // Helper to get or instantiate an HTMLAudioElement
  const getAudio = useCallback((id: string, src: string): HTMLAudioElement => {
    let audio = audioMapRef.current.get(id);
    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = 'auto';
      audioMapRef.current.set(id, audio);
    }
    return audio;
  }, []);

  // Hydrate from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        if (parsed.presetId && PRESETS.some((p) => p.id === parsed.presetId)) {
          setCurrentPresetId(parsed.presetId);
        }
        if (parsed.volumes && typeof parsed.volumes === 'object') {
          setVolumes(parsed.volumes);
        }
        // Never auto-play on refresh without user click (browser autoplay policy)
        setIsPlaying(false);
      }
    } catch {
      // ignore
    }
    isHydratedRef.current = true;
  }, []);

  // Persist state to localStorage
  useEffect(() => {
    if (!isHydratedRef.current) return;
    try {
      const dataToSave: SavedState = {
        presetId: currentPresetId,
        volumes,
        isPlaying,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // ignore
    }
  }, [currentPresetId, volumes, isPlaying]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Cleanup all audio on unmount
  useEffect(() => {
    const currentMap = audioMapRef.current;
    return () => {
      for (const audio of currentMap.values()) {
        try {
          audio.pause();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Set single sound volume
  const setSoundVolume = useCallback(
    (id: string, volume: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(volume)));
      const sound = SOUNDS.find((s) => s.id === id);
      if (!sound) return;

      setVolumes((prev) => {
        const next = { ...prev, [id]: clamped };
        return next;
      });

      const audio = getAudio(id, sound.src);

      if (clamped > 0) {
        audio.volume = clamped / 100;
        // User interacted: if globally paused, start playing
        if (!isPlaying) {
          setIsPlaying(true);
        }
        audio.play().catch(() => {});
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    },
    [getAudio, isPlaying]
  );

  // Toggle master play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Pause all active sounds
      for (const [, audio] of audioMapRef.current.entries()) {
        try {
          audio.pause();
        } catch {
          // ignore
        }
      }
      setIsPlaying(false);
    } else {
      // Check if any sound currently has volume > 0
      const activeEntries = Object.entries(volumes).filter(([, v]) => v > 0);

      let targetVolumes = { ...volumes };
      if (activeEntries.length === 0) {
        // Activate current preset if all volumes are currently 0
        const preset = PRESETS.find((p) => p.id === currentPresetId) || PRESETS[0];
        targetVolumes = { ...preset.sounds };
        setVolumes(targetVolumes);
      }

      // Start playing all active sounds
      for (const [id, vol] of Object.entries(targetVolumes)) {
        if (vol > 0) {
          const sound = SOUNDS.find((s) => s.id === id);
          if (sound) {
            const audio = getAudio(id, sound.src);
            audio.volume = Math.max(0, Math.min(1, vol / 100));
            audio.play().catch(() => {});
          }
        }
      }

      setIsPlaying(true);
    }
  }, [isPlaying, volumes, currentPresetId, getAudio]);

  // Apply a preset
  const applyPreset = useCallback(
    (preset: FocusPreset, autoPlay = true) => {
      setCurrentPresetId(preset.id);

      // Stop sounds not in new preset
      for (const [id, audio] of audioMapRef.current.entries()) {
        if (!preset.sounds[id] || preset.sounds[id] === 0) {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch {
            // ignore
          }
        }
      }

      // New volume state
      setVolumes({ ...preset.sounds });

      if (autoPlay || isPlaying) {
        setIsPlaying(true);
        for (const [id, vol] of Object.entries(preset.sounds)) {
          if (vol > 0) {
            const sound = SOUNDS.find((s) => s.id === id);
            if (sound) {
              const audio = getAudio(id, sound.src);
              audio.volume = Math.max(0, Math.min(1, vol / 100));
              audio.play().catch(() => {});
            }
          }
        }
      }
    },
    [isPlaying, getAudio]
  );

  // Shuffle random preset
  const shufflePreset = useCallback(() => {
    const others = PRESETS.filter((p) => p.id !== currentPresetId);
    const random = others[Math.floor(Math.random() * others.length)] || PRESETS[0];
    applyPreset(random, isPlaying);
  }, [currentPresetId, isPlaying, applyPreset]);

  // Cycle quote
  const nextQuote = useCallback(() => {
    setQuoteIndex((prev) => (prev + 1) % FOCUS_QUOTES.length);
  }, []);

  // Toggle Fullscreen on hero
  const toggleFullscreen = useCallback(() => {
    if (!heroRef.current) return;
    if (!document.fullscreenElement) {
      if (heroRef.current.requestFullscreen) {
        heroRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  const activePreset = PRESETS.find((p) => p.id === currentPresetId) || PRESETS[0];
  const currentQuote = FOCUS_QUOTES[quoteIndex % FOCUS_QUOTES.length];

  // Total active sound count
  const activeSoundCount = Object.values(volumes).filter((v) => v > 0).length;

  return {
    heroRef,
    currentPresetId,
    activePreset,
    currentQuote,
    volumes,
    isPlaying,
    isFullscreen,
    activeSoundCount,
    setSoundVolume,
    togglePlay,
    applyPreset,
    shufflePreset,
    nextQuote,
    toggleFullscreen,
  };
}
