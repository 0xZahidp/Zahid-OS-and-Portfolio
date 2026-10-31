'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Briefcase, MapPin, Share2, Check } from 'lucide-react';
import { Profile } from '@/types/profile';
import { VerifiedBadgeIcon } from '@/components/ui/Icons';
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
  const [localTime, setLocalTime] = useState<string>('5:49 PM');
  const [copied, setCopied] = useState(false);

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
        setLocalTime('5:49 PM');
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [profile.timezone]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name} - Developer Profile`,
          text: `${profile.full_name} - ${profile.headline}`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Sticky Header Bar */}
      <div className="sticky top-0 z-20 hidden md:flex h-17.5 items-center gap-3 border-b border-line bg-surface/85 px-6 backdrop-blur-md lg:px-8">
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
            {profile.full_name}
            <VerifiedBadgeIcon className="size-4.5 shrink-0 text-brand-500" />
          </p>
          <p className="text-meta text-ink-3">
            {profile.github_followers_count} followers on GitHub
          </p>
        </div>

        <button
          type="button"
          onClick={handleShare}
          aria-label="Share profile"
          className="btn btn-secondary grid size-10 place-items-center rounded-xl transition-all"
        >
          <span className="btn-content">
            {copied ? (
              <Check className="size-4.5 text-brand-500" />
            ) : (
              <Share2 className="size-4.5" />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={onContactClick}
          className="btn btn-primary h-10 px-4.5 rounded-xl font-semibold text-sm"
        >
          <span className="btn-content inline-flex items-center gap-2">
            Get in touch
          </span>
        </button>
      </div>

      {/* Decorative Matrix Slats Banner */}
      <ProfileBanner />

      {/* Profile Center Hero Section */}
      <section className="flex flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        {/* Avatar */}
        <ProfileAvatar src={profile.avatar_url} alt={profile.full_name} />

        {/* Name & Verification */}
        <h1 className="mt-3 flex items-center gap-1.5 text-title font-bold tracking-tight text-ink">
          {profile.full_name}
          <VerifiedBadgeIcon className="size-6 text-brand-500" />
        </h1>

        {/* Tagline */}
        <p className="mt-1 text-lead text-ink">{profile.headline}</p>

        {/* Availability Badge */}
        <button
          type="button"
          onClick={onContactClick}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-meta font-semibold text-brand-700 ring-1 ring-brand-500/25 dark:text-emerald-400 transition-colors hover:bg-brand-500/15"
        >
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-full bg-brand-400 opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
          </span>
          {profile.availability}
        </button>

        {/* Roles and Location Row */}
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-body text-ink-2">
          <li className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
            <Briefcase className="size-4.5 text-ink-3 shrink-0" />
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              CTO at{' '}
              <a
                href={profile.roles[0]?.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-ink"
              >
                <Image
                  src={profile.roles[0]?.company_logo || ''}
                  alt={profile.roles[0]?.company || ''}
                  width={18}
                  height={18}
                  className="size-4.5 rounded-md ring-1 ring-line object-cover"
                />
                {profile.roles[0]?.company}
              </a>
            </span>
            <span className="text-ink-3" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              Software Engineer at{' '}
              <a
                href={profile.roles[1]?.company_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-line-strong underline-offset-2 transition-colors hover:decoration-ink"
              >
                <Image
                  src={profile.roles[1]?.company_logo || ''}
                  alt={profile.roles[1]?.company || ''}
                  width={18}
                  height={18}
                  className="size-4.5 rounded-md ring-1 ring-line object-cover"
                />
                {profile.roles[1]?.company}
              </a>
            </span>
          </li>

          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-4.5 text-ink-3 shrink-0" />
            <span>{profile.location}</span>
            <span className="text-ink-3 tabular-nums">· {localTime}</span>
          </li>
        </ul>

        {/* Skills and Tools Badges Cloud */}
        <ProfileBadges />

        {/* Mobile Action Buttons */}
        <div className="mt-7 flex gap-3 md:hidden">
          <button
            type="button"
            onClick={onContactClick}
            className="btn btn-primary h-10 px-4.5 rounded-xl font-semibold text-sm"
          >
            <span className="btn-content inline-flex items-center gap-2">
              Get in touch
            </span>
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="btn btn-secondary h-10 px-4.5 rounded-xl font-semibold text-sm"
          >
            <span className="btn-content inline-flex items-center gap-2">
              {copied ? (
                <>
                  <Check className="size-4.5 text-brand-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="size-4.5" />
                  <span>Share</span>
                </>
              )}
            </span>
          </button>
        </div>
      </section>

      {/* Profile Tabs (Resume / Work) */}
      <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};

