'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Briefcase, MapPin } from 'lucide-react';
import { Profile } from '@/types/profile';
import { VerifiedBadgeIcon, TablerShare } from '@/components/ui/Icons';
import { Button } from '@/components/ui/Button';
import { ShareModal } from '@/components/ui/ShareModal';
import { ProfileBanner } from './ProfileBanner';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileBadges } from './ProfileBadges';
import { ProfileTabs } from './ProfileTabs';

interface ProfileHeaderProps {
  profile: Profile;
  activeTab: 'resume' | 'work';
  onTabChange: (tab: 'resume' | 'work') => void;
  onContactClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  activeTab,
  onTabChange,
  onContactClick,
}) => {
  const [localTime, setLocalTime] = useState<string>('6:11 PM');
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: profile.timezone || 'Asia/Dhaka',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(now);
        setLocalTime(formatted);
      } catch {
        setLocalTime('6:11 PM');
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [profile.timezone]);

  return (
    <div className="w-full">
      {/* Decorative Matrix Slats Banner */}
      <ProfileBanner />

      {/* Profile Center Hero Section */}
      <section className="flex flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        {/* Avatar */}
        <ProfileAvatar src={profile.avatar_url} alt={profile.full_name} />

        {/* Name & Verification */}
        <h1 className="mt-3 flex items-center gap-1.5 text-title font-bold tracking-tight text-ink">
          <span>{profile.full_name}</span>
          <VerifiedBadgeIcon className="size-6 text-brand-500" />
        </h1>

        {/* Tagline */}
        <p className="mt-1 text-lead text-ink">{profile.headline}</p>

        {/* Availability Badge */}
        <button
          type="button"
          onClick={onContactClick}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-meta font-semibold text-brand-700 ring-1 ring-brand-500/25 dark:text-link transition-colors hover:bg-brand-500/15"
        >
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-full bg-brand-400 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
          </span>
          {profile.availability}
        </button>

        {/* Roles and Location Row */}
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-body text-ink-2">
          {profile.roles?.length > 0 && (
            <li className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
              <Briefcase className="size-4.5 text-ink-3 shrink-0" />
              {profile.roles.map((role, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <span className="text-ink-3" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    {role.title} at{' '}
                    <a
                      href={role.company_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-ink"
                    >
                      {role.company_logo && (
                        <Image
                          src={role.company_logo}
                          alt={role.company || ''}
                          width={18}
                          height={18}
                          className="size-4.5 rounded-md ring-1 ring-line object-cover"
                          unoptimized
                        />
                      )}
                      <span>{role.company}</span>
                    </a>
                  </span>
                </React.Fragment>
              ))}
            </li>
          )}

          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-4.5 text-ink-3 shrink-0" />
            <span>{profile.location}</span>
            <span className="text-ink-3 tabular-nums" suppressHydrationWarning>· {localTime}</span>
          </li>
        </ul>

        {/* Skills and Tools Badges Cloud */}
        <ProfileBadges />

        {/* Mobile Action Buttons */}
        <div className="mt-7 flex gap-3 md:hidden">
          <Button
            variant="primary"
            onClick={onContactClick}
            className="rounded-[14px] h-10 px-5 text-sm font-semibold"
          >
            Get in touch
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsShareOpen(true)}
            className="rounded-[14px] h-10 px-4 text-sm font-semibold"
          >
            <TablerShare className="size-4.5" />
            <span>Share</span>
          </Button>
        </div>
      </section>

      {/* Profile Tabs (Resume / Work) */}
      <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />

      {/* Share Profile Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        profile={profile}
      />
    </div>
  );
};
