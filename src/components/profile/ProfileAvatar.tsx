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
    <div className="relative -mt-12 sm:-mt-14 shrink-0 z-10">
      <div className="size-24 rounded-full border-4 border-surface shadow-md overflow-hidden bg-surface-2">
        <Image
          src={src}
          alt={alt}
          width={96}
          height={96}
          priority
          className="size-full object-cover"
        />
      </div>
    </div>
  );
};

