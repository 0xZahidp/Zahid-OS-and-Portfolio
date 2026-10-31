'use client';

import React from 'react';
import Image from 'next/image';
import { Profile } from '@/types/profile';
import { VerifiedBadgeIcon, TablerShare } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';

interface DesktopStickyHeaderProps {
  profile: Profile;
  onContactClick: () => void;
  onShareClick: () => void;
}

export const DesktopStickyHeader: React.FC<DesktopStickyHeaderProps> = ({
  profile,
  onContactClick,
  onShareClick,
}) => {
  return (
    <header className="sticky top-0 z-30 hidden md:flex h-[70px] items-center gap-3.5 border-b border-line bg-surface/85 px-6 backdrop-blur-md lg:px-8">
      {/* 44px round avatar */}
      <div className="relative size-11 rounded-full ring-1 ring-line overflow-hidden shrink-0">
        <Image
          src={profile.avatar_url}
          alt={profile.full_name}
          width={44}
          height={44}
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <p className="flex items-center gap-1.5 truncate text-base font-semibold text-ink">
          <span>{profile.full_name}</span>
          <VerifiedBadgeIcon className="size-4.5 shrink-0 text-emerald-500" />
        </p>
        <p className="text-xs text-ink-3 mt-0.5">
          {profile.github_followers_count} followers on GitHub
        </p>
      </div>

      {/* Share Button - 44px, secondary, 14px radius */}
      <Button
        variant="secondary"
        size="icon"
        onClick={onShareClick}
        aria-label="Share profile"
        className="rounded-[14px]"
      >
        <TablerShare className="size-5" />
      </Button>

      {/* "Get in touch" Button - 44px, primary green gradient, 14px radius */}
      <Button
        variant="primary"
        onClick={onContactClick}
        className="rounded-[14px] h-11 px-5.5 font-semibold text-sm"
      >
        Get in touch
      </Button>
    </header>
  );
};
