'use client';

import React from 'react';

export const ProfileBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden h-28 sm:h-36 w-full rounded-2xl border border-line bg-surface-2/40 mb-6 select-none">
      {/* Editorial Dot Grid Pattern */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-30 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:16px_16px]"
        aria-hidden="true"
      />

      {/* Subtle Warm Amber/Copper Accent Corner Sheen */}
      <div
        className="absolute -right-12 -top-12 size-48 rounded-full bg-accent/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -left-12 -bottom-12 size-48 rounded-full bg-accent/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Hairline Editorial Accent Line at Bottom */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </div>
  );
};
