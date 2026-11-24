'use client';

import React from 'react';
import Image from 'next/image';

interface ProfileAvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ src, alt, className = '' }) => {
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div className="size-24 sm:size-28 rounded-2xl border border-line bg-surface-2 overflow-hidden shadow-xs ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:scale-[1.02]">
        <Image
          src={src}
          alt={alt}
          width={112}
          height={112}
          priority
          className="size-full object-cover"
        />
      </div>
    </div>
  );
};
