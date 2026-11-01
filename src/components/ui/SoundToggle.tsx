'use client';

import React, { useState, useEffect } from 'react';
import { TablerVolume, TablerVolumeOff } from '@/components/ui/Icons';
import { isSoundEnabled, toggleSound } from '@/lib/sound';

export const SoundToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isSoundEnabled());

    const handleSoundChange = (e: Event) => {
      const detail = (e as CustomEvent<{ enabled: boolean }>).detail;
      if (detail && typeof detail.enabled === 'boolean') {
        setEnabled(detail.enabled);
      }
    };

    window.addEventListener('folioframe-sound-change', handleSoundChange);
    return () => {
      window.removeEventListener('folioframe-sound-change', handleSoundChange);
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = toggleSound();
    setEnabled(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={enabled ? 'Mute sound effects' : 'Enable sound effects'}
      aria-pressed={enabled}
      title={enabled ? 'Sound effects enabled (Click to mute)' : 'Sound effects muted (Click to enable)'}
      data-no-sound
      className={`btn btn-secondary grid size-9 place-items-center rounded-full transition-all active:scale-95 cursor-pointer ${className}`}
    >
      <span className="btn-content">
        {enabled ? (
          <TablerVolume className="size-4.5 text-brand-600 dark:text-emerald-400" />
        ) : (
          <TablerVolumeOff className="size-4.5 text-ink-3" />
        )}
      </span>
    </button>
  );
};
