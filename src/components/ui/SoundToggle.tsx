'use client';

import React, { useState } from 'react';
import { TablerVolume, TablerVolumeOff } from '@/components/ui/Icons';

export const SoundToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [muted, setMuted] = useState(false);

  const toggleSound = () => {
    setMuted(!muted);
  };

  return (
    <button
      type="button"
      onClick={toggleSound}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      className={`btn btn-secondary grid size-9 place-items-center rounded-full transition-transform active:scale-95 ${className}`}
    >
      <span className="btn-content">
        {muted ? (
          <TablerVolumeOff className="size-4.5 text-zinc-400" />
        ) : (
          <TablerVolume className="size-4.5 text-zinc-300 dark:text-zinc-300 text-zinc-700" />
        )}
      </span>
    </button>
  );
};
