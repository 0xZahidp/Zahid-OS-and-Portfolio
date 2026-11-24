'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Briefcase, ArrowDown } from 'lucide-react';
import { Profile } from '@/types/profile';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  TelegramIcon,
} from '@/components/ui/Icons';
import { PremiumFlipButton } from '@/components/ui/PremiumFlipButton';

interface ProfileHeaderProps {
  profile: Profile;
  onContactClick?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  onContactClick,
}) => {
  const handleScrollToWork = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.querySelector('#work');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContactAction = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      const el = document.querySelector('#connect');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const defaultRoles = [
    {
      title: 'Jr. Software Engineer',
      company: 'TwinForce Solutions Ltd',
      company_url: 'https://twinforce.net',
      company_logo: '/uploads/logos/logo-scholar-quest-1793536616620.png',
    },
    {
      title: 'CTO & Co-Founder',
      company: 'Dhakaiya Bites',
      company_url: 'https://dhakaiyabites-zeta.vercel.app/',
      company_logo: '/uploads/logos/logo-dhakaiya-bites-1793536613357.png',
    },
  ];

  const roles = (profile.roles && profile.roles.length > 0) ? profile.roles : defaultRoles;

  return (
    <section className="pt-2 sm:pt-4">
      {/* Top Row: Small Squircle Avatar + Name & Availability Chip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative size-14 sm:size-16 rounded-xl border border-line bg-surface-2 overflow-hidden shadow-xs ring-1 ring-black/5 dark:ring-white/10 shrink-0">
            <Image
              src={profile.avatar_url || '/images/avatar.webp'}
              alt={profile.full_name}
              width={64}
              height={64}
              priority
              className="size-full object-cover"
            />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-text">
              {profile.full_name}
            </div>
            <div className="text-xs font-mono text-muted">
              @{profile.username || '0xZahidp'}
            </div>
          </div>
        </div>

        {/* Availability Chip: New Natural Phrase (NOT "Open to new conversations") */}
        <div
          onClick={handleContactAction}
          className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/15 transition-colors cursor-pointer select-none"
        >
          <span className="relative flex size-2 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          <span>Available for select freelance &amp; full-time roles</span>
        </div>
      </div>

      {/* Large Bold Headline (Current one-line bio as headline) */}
      <h1 className="mt-6 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-text leading-[1.25]">
        {profile.headline}
      </h1>

      {/* Roles Line & Location */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-muted">
        <div className="inline-flex flex-wrap items-center gap-1.5">
          <Briefcase className="size-3.5 text-muted shrink-0" />
          {roles.map((role, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-muted/60">·</span>}
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span>{role.title} at</span>
                <a
                  href={role.company_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-text underline decoration-line hover:decoration-accent transition-colors"
                >
                  {role.company}
                </a>
              </span>
            </React.Fragment>
          ))}
        </div>

        <span className="hidden sm:inline text-muted/60">·</span>

        <div className="inline-flex items-center gap-1 text-muted">
          <MapPin className="size-3.5 text-muted shrink-0" />
          <span>{profile.location || 'Dhaka, Bangladesh'}</span>
        </div>
      </div>

      {/* Actions Row: Two Buttons + Inline Social Icons */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 pt-2">
        {/* Buttons: "View work" and "Get in touch" */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleScrollToWork}
            className="btn btn-secondary h-9 sm:h-10 px-4 rounded-xl text-xs sm:text-sm font-semibold gap-1.5 cursor-pointer"
          >
            <span>View work</span>
            <ArrowDown className="size-3.5" />
          </button>

          <PremiumFlipButton
            textOne="Get in touch"
            textTwo="Let's build →"
            onClick={handleContactAction}
            size="sm"
          />
        </div>

        {/* Inline Social Icons (Telegram, GitHub, X, LinkedIn) */}
        <div className="flex items-center gap-2 text-muted">
          <a
            href="https://t.me/0xZahidP"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="btn btn-secondary size-9 grid place-items-center rounded-xl hover:text-text cursor-pointer"
          >
            <TelegramIcon className="size-4" />
          </a>
          <a
            href="https://github.com/0xZahidp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="btn btn-secondary size-9 grid place-items-center rounded-xl hover:text-text cursor-pointer"
          >
            <GitHubIcon className="size-4" />
          </a>
          <a
            href="https://x.com/0xZahidP"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="btn btn-secondary size-9 grid place-items-center rounded-xl hover:text-text cursor-pointer"
          >
            <XIcon className="size-3.5" />
          </a>
          <a
            href="https://linkedin.com/in/0xZahidp"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="btn btn-secondary size-9 grid place-items-center rounded-xl hover:text-text cursor-pointer"
          >
            <LinkedInIcon className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
