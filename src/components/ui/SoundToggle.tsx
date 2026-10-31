'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

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
          <VolumeX className="size-4.5 text-zinc-400" />
        ) : (
          <Volume2 className="size-4.5 text-zinc-300" />
        )}
      </span>
    </button>
  );
};

