'use client';

import React from 'react';
import Image from 'next/image';
import { Profile } from '@/types/profile';
import { VerifiedBadgeIcon, TablerShare } from '@/components/ui/Icons';

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
    <header className="sticky top-0 z-20 hidden md:flex h-[4.375rem] items-center gap-3 border-b border-line bg-surface/80 px-6 backdrop-blur-md lg:px-8">
      {/* 36px round avatar */}
      <div className="relative size-9 rounded-full ring-1 ring-line overflow-hidden shrink-0">
        <Image
          src={profile.avatar_url}
          alt={profile.full_name}
          width={36}
          height={36}
          className="size-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <p className="flex items-center gap-1.5 truncate text-body font-semibold text-ink">
          <span>{profile.full_name}</span>
          <VerifiedBadgeIcon className="size-4 shrink-0 text-brand-500" />
        </p>
        <p className="text-meta text-ink-3 mt-0.5">
          {profile.github_followers_count} followers on GitHub
        </p>
      </div>

      {/* Share Button - size-10 rounded-xl secondary tactile button */}
      <button
        type="button"
        onClick={onShareClick}
        aria-label="Share profile"
        className="btn btn-secondary grid size-10 place-items-center rounded-xl"
      >
        <TablerShare className="size-4.5" />
      </button>

      {/* Primary Tactile Button */}
      <button
        type="button"
        onClick={onContactClick}
        className="btn btn-primary h-10 px-4.5 text-body"
      >
        Get in touch
      </button>
    </header>
  );
};
