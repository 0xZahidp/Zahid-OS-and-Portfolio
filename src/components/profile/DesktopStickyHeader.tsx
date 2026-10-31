'use client';

import React from 'react';
import Image from 'next/image';
import { Profile } from '@/types/profile';
import { VerifiedBadgeIcon, TablerShare } from '@/components/ui/Icons';
import { TactileButton } from '@/components/ui/TactileButton';

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
    <header className="sticky top-0 z-30 hidden md:flex h-17.5 items-center gap-3 border-b border-line bg-surface/85 px-6 backdrop-blur-md lg:px-8">
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
        <p className="flex items-center gap-1.5 truncate text-base font-semibold text-ink">
          <span>{profile.full_name}</span>
          <VerifiedBadgeIcon className="size-4.5 shrink-0 text-brand-500" />
        </p>
        <p className="text-meta text-ink-3">
          {profile.github_followers_count} followers on GitHub
        </p>
      </div>

      <button
        type="button"
        onClick={onShareClick}
        aria-label="Share profile"
        className="btn btn-secondary grid size-10 place-items-center rounded-xl transition-all hover:bg-surface-2"
      >
        <span className="btn-content">
          <TablerShare className="size-4.5" />
        </span>
      </button>

      <TactileButton onClick={onContactClick}>
        Get in touch
      </TactileButton>
    </header>
  );
};

