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
    <div className="relative -mt-[60px] shrink-0 z-10">
      <div className="size-[120px] rounded-full ring-4 ring-white dark:ring-[#121215] shadow-lg overflow-hidden bg-surface-2">
        <Image
          src={src}
          alt={alt}
          width={120}
          height={120}
          priority
          className="size-full object-cover"
        />
      </div>
    </div>
  );
};
