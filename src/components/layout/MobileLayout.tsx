'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
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
import { PeopleSection } from '@/components/sections/PeopleSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { LibrarySection } from '@/components/sections/LibrarySection';
import { FocusSection } from '@/components/sections/FocusSection';
import { WorkTabContent } from '@/components/sections/WorkTabContent';
import { usePortfolio } from '@/context/PortfolioContext';

const ShareModal = dynamic(
  () => import('@/components/ui/ShareModal').then((m) => m.ShareModal),
  { ssr: false }
);
import { Briefcase, MapPin } from 'lucide-react';
import { getPlatformIcon } from '@/components/ui/Icons';

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
  const { content } = usePortfolio();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleContactClick = () => {
    onNavigate('contact');
  };

  const defaultSocials = [
    { id: 'def-github', platform: 'github', label: 'GitHub', url: 'https://github.com/0xZahidp' },
    { id: 'def-x', platform: 'x', label: 'X', url: 'https://x.com/0xZahidP' },
    { id: 'def-linkedin', platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/0xZahidp' },
    { id: 'def-telegram', platform: 'telegram', label: 'Telegram', url: 'https://t.me/0xZahidP' },
    { id: 'def-facebook', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/0xZahidp' },
  ];
  const socials = Array.isArray(content.socialLinks) && content.socialLinks.length > 0
    ? content.socialLinks
    : defaultSocials;

  return (
    <div className="flex min-h-dvh flex-col md:hidden" suppressHydrationWarning>
      {/* 1. Mobile Sticky Top Navigation Bar */}
      <MobileTopBar
        onOpenMenu={() => setIsMenuOpen(true)}
        onContactClick={handleContactClick}
      />

      {/* Hamburger Drawer */}
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={onNavigate}
      />

      {/* 2. Main Scrollable Content */}
      <main className="flex-1 pb-24">
        {activeSection === 'projects' ? (
          <div className="px-4 py-6">
            <h1 className="text-xl font-bold tracking-tight text-ink mb-1">Projects</h1>
            <p className="text-sm text-ink-2 mb-6">
              Products I&apos;ve designed, built and shipped, plus the open source work behind them.
            </p>
            <ProjectsSection />
          </div>
        ) : activeSection === 'people' ? (
          <div className="px-4 py-6">
            <h1 className="text-xl font-bold tracking-tight text-ink mb-6">People</h1>
            <PeopleSection />
          </div>
        ) : activeSection === 'library' ? (
          <div className="px-4 py-6">
            <h1 className="text-xl font-bold tracking-tight text-ink mb-6">Library</h1>
            <LibrarySection />
          </div>
        ) : activeSection === 'focus' ? (
          <div className="px-4 py-6">
            <h1 className="text-xl font-bold tracking-tight text-ink mb-6">Focus</h1>
            <FocusSection />
          </div>
        ) : activeSection === 'contact' ? (
          <div className="px-4 py-6">
            <h1 className="text-xl font-bold tracking-tight text-ink mb-6">Contact</h1>
            <ContactSection />
          </div>
        ) : (
          <>
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
                onClick={handleContactClick}
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
                {profile.roles?.length > 0 && (
                  <li className="inline-flex flex-wrap items-center justify-center gap-1.5">
                    <Briefcase className="size-4.5 text-ink-3 shrink-0" />
                    {profile.roles.map((role, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-ink-3">·</span>}
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          {role.title} at{' '}
                          <a
                            href={role.company_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-ink underline decoration-line-strong underline-offset-2"
                          >
                            {role.company}
                          </a>
                        </span>
                      </React.Fragment>
                    ))}
                  </li>
                )}

                <li className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4.5 text-ink-3 shrink-0" />
                  <span>{profile.location}</span>
                </li>
              </ul>

              {/* Badges Cloud */}
              <ProfileBadges />

              {/* Action Buttons */}
              <div className="mt-7 flex w-full max-w-sm gap-3">
                <button
                  type="button"
                  onClick={handleContactClick}
                  className="flex-1 btn btn-primary h-10 px-4.5 rounded-xl font-semibold text-sm"
                >
                  Get in touch
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="flex-1 btn btn-secondary h-10 px-4.5 rounded-xl font-semibold text-sm hover:bg-surface-2"
                >
                  <span className="btn-content inline-flex items-center gap-2">
                    <TablerShare className="size-4.5" />
                    <span>Share</span>
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
                </>
              ) : (
                <WorkTabContent onNavigateToProjects={() => onNavigate('projects')} />
              )}
            </div>
          </>
        )}

        {/* Mobile Footer with Social Icons */}
        <footer className="mt-14 pt-6 border-t border-line flex flex-col items-center gap-3 text-center px-4">
          <div className="flex items-center gap-4 text-ink-3">
            {socials.map((social) => (
              <a
                key={social.id || social.url}
                href={social.url}
                target="_blank"
                rel="me noopener noreferrer"
                aria-label={social.label || social.platform}
                className="hover:text-ink transition-colors"
              >
                {getPlatformIcon(social.platform, social.url, 'size-4')}
              </a>
            ))}
          </div>
          <p className="text-xs text-ink-3">© 2026 Zahid</p>
        </footer>
      </main>

      {/* 3. Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomBar
        activeSection={activeSection}
        onNavigate={onNavigate}
      />

      {/* Share Profile Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        profile={profile}
      />
    </div>
  );
};
