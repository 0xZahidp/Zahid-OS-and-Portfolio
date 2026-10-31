'use client';

import React from 'react';
import Image from 'next/image';

interface ProfileAvatarProps {
  src: string;
  alt: string;
  size?: number;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ src, alt }) => {
  return (
    <div className="relative -mt-13 shrink-0 z-10">
      <div className="size-26 rounded-full ring-4 ring-surface overflow-hidden bg-surface-2">
        <Image
          src={src}
          alt={alt}
          width={117}
          height={117}
          priority
          className="size-full object-cover"
        />
      </div>
    </div>
  );
};
