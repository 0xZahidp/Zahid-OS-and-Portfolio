'use client';

import { useEffect } from 'react';
import { initGlobalSoundListener } from '@/lib/sound';

export const SoundManager: React.FC = () => {
  useEffect(() => {
    const cleanup = initGlobalSoundListener();
    return cleanup;
  }, []);

  return null;
};

