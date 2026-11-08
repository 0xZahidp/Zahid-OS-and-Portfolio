'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const WaterRippleMatrix = dynamic(
  () => import('./WaterRippleMatrix').then((m) => m.WaterRippleMatrix),
  { ssr: false }
);

export const ProfileBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden h-[235px] w-full border-b border-line bg-surface flex items-center justify-center select-none">
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
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-5)',
            top: '-30%',
            left: '76%',
            ['--dur' as string]: '31s',
            ['--delay' as string]: '-6s',
          }}
        />
        <span
          className="cover-blob"
          style={{
            ['--blob' as string]: 'var(--cover-6)',
            top: '45%',
            left: '38%',
            ['--dur' as string]: '33s',
            ['--delay' as string]: '-16s',
            width: '45%',
          }}
        />
      </div>

      {/* Interactive Water Ripple Matrix Canvas - Chunkier slats matching REFERENCE */}
      <WaterRippleMatrix className="h-full w-full" slatWidth={11} slatHeight={25} gap={4} />
    </div>
  );
};
