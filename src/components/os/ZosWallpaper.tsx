'use client';

import React from 'react';
import { getZosWallpaper } from '@/lib/os/wallpapers';
import { ZahidOsWallpaper } from '@/types/os';

interface ZosWallpaperProps {
  wallpaperId?: ZahidOsWallpaper | string;
  className?: string;
  isContainer?: boolean;
  showMeshGrid?: boolean;
  children?: React.ReactNode;
}

export const ZosWallpaper: React.FC<ZosWallpaperProps> = ({
  wallpaperId,
  className = '',
  isContainer = false,
  showMeshGrid = true,
  children,
}) => {
  const wp = getZosWallpaper(wallpaperId);

  return (
    <div
      className={`${
        isContainer ? 'absolute inset-0' : 'fixed inset-0'
      } -z-10 overflow-hidden bg-gradient-to-br ${wp.gradientClass} transition-colors duration-700 ${className}`}
    >
      {/* Dynamic Ambient Radiant Orb 1 (Top / Center) */}
      <div
        className={`absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full blur-3xl pointer-events-none transition-all duration-700 animate-pulse ${wp.orb1Class}`}
        style={{ animationDuration: '8s' }}
      />

      {/* Dynamic Ambient Radiant Orb 2 (Bottom / Right) */}
      <div
        className={`absolute -bottom-32 -right-20 w-[40rem] h-[40rem] rounded-full blur-3xl pointer-events-none transition-all duration-700 animate-pulse ${wp.orb2Class}`}
        style={{ animationDuration: '10s' }}
      />

      {/* Tactile Cyber Dot/Mesh Grid Pattern */}
      {showMeshGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-50 transition-opacity duration-700"
          style={{
            backgroundImage: `radial-gradient(circle at center, ${wp.gridColor} 1.2px, transparent 1.2px)`,
            backgroundSize: '26px 26px',
          }}
        />
      )}

      {/* Subtle Top & Bottom Cinematic Vignettes */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      {children}
    </div>
  );
};
