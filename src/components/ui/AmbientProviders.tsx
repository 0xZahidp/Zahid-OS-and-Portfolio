'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ThemeManager } from './ThemeManager';

const ContextMenu = dynamic(
  () => import('./ContextMenu').then((m) => m.ContextMenu),
  { ssr: false }
);

const SoundManager = dynamic(
  () => import('./SoundManager').then((m) => m.SoundManager),
  { ssr: false }
);

const ConfirmDialog = dynamic(
  () => import('./ConfirmDialog').then((m) => m.ConfirmDialog),
  { ssr: false }
);

export const AmbientProviders: React.FC = () => {
  return (
    <>
      <ThemeManager />
      <SoundManager />
      <ContextMenu />
      <ConfirmDialog />
    </>
  );
};

