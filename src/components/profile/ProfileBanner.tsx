'use client';

import React from 'react';
import { WaterRippleMatrix } from './WaterRippleMatrix';

export const ProfileBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden h-36 sm:h-52 w-full border-b border-line bg-surface flex items-center justify-center select-none">
      {/* Background ambient glowing blobs */}
      <div className="cover absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-1)',
            top: '-45%',
            left: '-12%',
            ['--dur' as string]: '24s',
            ['--delay' as string]: '0s',
          }}
        />
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-2)',
            top: '15%',
            left: '8%',
            ['--dur' as string]: '27s',
            ['--delay' as string]: '-4s',
          }}
        />
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-3)',
            top: '-35%',
            left: '32%',
            ['--dur' as string]: '29s',
            ['--delay' as string]: '-8s',
          }}
        />
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-4)',
            top: '5%',
            left: '55%',
            ['--dur' as string]: '23s',
            ['--delay' as string]: '-12s',
          }}
        />
      </div>

      {/* Interactive Water Ripple Matrix Canvas */}
      <WaterRippleMatrix className="h-full w-full" />
    </div>
  );
};
