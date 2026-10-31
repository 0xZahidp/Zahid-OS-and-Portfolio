'use client';

import React, { useState } from 'react';
import { Profile } from '@/types/profile';
import { MobileTopBar } from '@/components/navigation/MobileTopBar';
import { MobileBottomBar } from '@/components/navigation/MobileBottomBar';
import { MobileMenu } from '@/components/navigation/MobileMenu';
import { ProfileBanner } from '@/components/profile/ProfileBanner';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { ProfileBadges } from '@/components/profile/ProfileBadges';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { VerifiedBadgeIcon, TablerShare } from '@/components/ui/Icons';
import { AboutSection } from '@/components/sections/AboutSection';
import { ExperienceSection } from '@/components/sections/ExperienceSection';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { ProjectsSection } from '@/components/sections/ProjectsSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { Briefcase, MapPin, Check } from 'lucide-react';
import Image from 'next/image';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
} from '@/components/ui/Icons';

interface MobileLayoutProps {
  profile: Profile;
  activeSection: string;
  activeTab: 'resume' | 'work';
  onNavigate: (section: string) => void;
  onTabChange: (tab: 'resume' | 'work') => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  profile,
  activeSection,
  activeTab,
  onNavigate,
  onTabChange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name} (Zahid) - Developer Profile`,
          text: `${profile.full_name} - ${profile.headline}`,
          url: window.location.href,
        });
        return;
      } catch {
        // fallback
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col md:hidden">
      {/* 1. Mobile Sticky Top Navigation Bar */}
      <MobileTopBar
        onOpenMenu={() => setIsMenuOpen(true)}
        onContactClick={scrollToContact}
      />

      {/* Hamburger Drawer */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={onNavigate}
      />

      {/* 2. Main Scrollable Content */}
      <main className="flex-1 pb-24">
        {/* Decorative Green Matrix Slat Banner */}
        <ProfileBanner />

        {/* Profile Hero Information */}
        <section className="flex flex-col items-center px-4 text-center">
          {/* Overlapping Avatar */}
          <ProfileAvatar src={profile.avatar_url} alt={profile.full_name} />

          {/* Full Name & Verification */}
          <h1 className="mt-3 flex items-center gap-1.5 text-title font-bold tracking-tight text-ink">
            <span>{profile.full_name}</span>
            <VerifiedBadgeIcon className="size-6 text-brand-500" />
          </h1>

          {/* Tagline */}
          <p className="mt-1 text-lead text-ink">{profile.headline}</p>

          {/* Availability Badge */}
          <button
            type="button"
            onClick={scrollToContact}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-meta font-semibold text-brand-700 ring-1 ring-brand-500/25 dark:text-emerald-400 transition-colors hover:bg-brand-500/15"
          >
            <span className="relative flex size-2" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-brand-400 opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
            </span>
            {profile.availability}
          </button>

          {/* Role and Location Information */}
          <ul className="mt-4 flex flex-col items-center justify-center gap-2 text-body text-ink-2">
            <li className="inline-flex flex-wrap items-center justify-center gap-1.5">
              <Briefcase className="size-4 text-ink-3 shrink-0" />
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                CTO at{' '}
                <a
                  href={profile.roles[0]?.company_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-ink underline decoration-line-strong underline-offset-2"
                >
                  <Image
                    src={profile.roles[0]?.company_logo || ''}
                    alt={profile.roles[0]?.company || ''}
                    width={16}
                    height={16}
                    className="size-4 rounded ring-1 ring-line object-cover"
                  />
                  {profile.roles[0]?.company}
                </a>
              </span>
              <span className="text-ink-3">·</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                Software Engineer at{' '}
                <a
                  href={profile.roles[1]?.company_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-ink underline decoration-line-strong underline-offset-2"
                >
                  <Image
                    src={profile.roles[1]?.company_logo || ''}
                    alt={profile.roles[1]?.company || ''}
                    width={16}
                    height={16}
                    className="size-4 rounded ring-1 ring-line object-cover"
                  />
                  {profile.roles[1]?.company}
                </a>
              </span>
            </li>

            <li className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-ink-3 shrink-0" />
              <span>{profile.location}</span>
              <span className="text-ink-3 tabular-nums">· 6:11 PM</span>
            </li>
          </ul>

          {/* Technology Badges */}
          <ProfileBadges />

          {/* Mobile Action Buttons */}
          <div className="mt-7 flex gap-3 w-full max-w-xs justify-center">
            <button
              type="button"
              onClick={scrollToContact}
              className="flex-1 btn btn-primary h-10 px-5 rounded-xl font-bold text-sm tracking-[-0.01em]"
            >
              <span className="btn-content">Get in touch</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 btn btn-secondary h-10 px-4.5 rounded-xl font-semibold text-sm"
            >
              <span className="btn-content inline-flex items-center gap-2">
                {copied ? (
                  <>
                    <Check className="size-4 text-brand-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <TablerShare className="size-4.5" />
                    <span>Share</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </section>

        {/* Profile Tabs */}
        <ProfileTabs activeTab={activeTab} onTabChange={onTabChange} />

        {/* Tab Content */}
        <div className="px-4 py-8">
          {activeTab === 'resume' ? (
            <>
              <AboutSection />
              <ExperienceSection />
              <SkillsSection />
              <ContactSection />
            </>
          ) : (
            <>
              <ProjectsSection />
              <ContactSection />
            </>
          )}

          {/* Mobile Footer */}
          <footer className="mt-14 pt-6 border-t border-line flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-4 text-ink-3">
              <a
                href="https://github.com/0xZahidp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <GitHubIcon className="size-4" />
              </a>
              <a
                href="https://x.com/0xZahidP"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X"
              >
                <XIcon className="size-4" />
              </a>
              <a
                href="https://linkedin.com/in/0xZahidp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <LinkedInIcon className="size-4" />
              </a>
              <a
                href="https://facebook.com/0xZahidp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FacebookIcon className="size-4" />
              </a>
            </div>
            <p className="text-xs text-ink-3">© 2026 Md Zahid Hasan Patwary (Zahid)</p>
          </footer>
        </div>
      </main>

      {/* 3. Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomBar
        activeSection={activeSection}
        onNavigate={onNavigate}
      />
    </div>
  );
};
