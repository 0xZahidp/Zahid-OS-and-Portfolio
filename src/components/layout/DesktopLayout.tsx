'use client';

import React, { useState } from 'react';
import { Profile } from '@/types/profile';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { DesktopStickyHeader } from '@/components/profile/DesktopStickyHeader';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ShareModal } from '@/components/ui/ShareModal';
import { AboutSection } from '@/components/sections/AboutSection';
import { ExperienceSection } from '@/components/sections/ExperienceSection';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { ProjectsSection } from '@/components/sections/ProjectsSection';
import { PeopleSection } from '@/components/sections/PeopleSection';
import { ContactSection } from '@/components/sections/ContactSection';
import { WorkTabContent } from '@/components/sections/WorkTabContent';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
  ProductHuntIcon,
  DevToIcon,
  BehanceIcon,
} from '@/components/ui/Icons';

interface DesktopLayoutProps {
  profile: Profile;
  activeSection: string;
  activeTab: 'resume' | 'work';
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (section: string) => void;
  onTabChange: (tab: 'resume' | 'work') => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  profile,
  activeSection,
  activeTab,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  onTabChange,
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);

  const handleContactClick = () => {
    onNavigate('contact');
  };

  const renderFooter = () => (
    <footer className="mt-20 pt-8 pb-6 border-t border-line flex flex-col items-center gap-4 text-center">
      <div className="flex items-center gap-4 text-ink-3">
        <a
          href="https://github.com/0xZahidp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="hover:text-ink transition-colors"
        >
          <GitHubIcon className="size-4" />
        </a>
        <a
          href="https://x.com/0xZahidP"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
          className="hover:text-ink transition-colors"
        >
          <XIcon className="size-4" />
        </a>
        <a
          href="https://linkedin.com/in/0xZahidp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="hover:text-ink transition-colors"
        >
          <LinkedInIcon className="size-4" />
        </a>
        <a
          href="https://producthunt.com/@0xzahidp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Product Hunt"
          className="hover:text-ink transition-colors"
        >
          <ProductHuntIcon className="size-4" />
        </a>
        <a
          href="https://facebook.com/0xZahidp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="hover:text-ink transition-colors"
        >
          <FacebookIcon className="size-4" />
        </a>
        <a
          href="https://dev.to/0xzahidp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="DEV"
          className="hover:text-ink transition-colors"
        >
          <DevToIcon className="size-4" />
        </a>
        <a
          href="https://behance.net/0xzahidp"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Behance"
          className="hover:text-ink transition-colors"
        >
          <BehanceIcon className="size-4" />
        </a>
      </div>
    </footer>
  );

  return (
    <div className="mx-auto hidden min-h-dvh max-w-[1740px] md:flex">
      {/* 1. Left Column (Sticky Sidebar) */}
      <LeftSidebar
        activeSection={activeSection}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        onNavigate={onNavigate}
      />

      {/* 2. Center Column (Scrollable Main Content) */}
      <main className="min-w-0 flex-1 border-x border-line pb-16">
        {activeSection === 'projects' ? (
          <div>
            {/* Sticky Header for Projects View */}
            <header className="sticky top-0 z-30 flex h-[70px] items-center px-6 lg:px-8 border-b border-line bg-surface/85 backdrop-blur-md">
              <h1 className="text-xl font-bold tracking-tight text-ink">Projects</h1>
            </header>

            <div className="px-6 py-8 lg:px-8">
              <p className="text-base text-ink-2 mb-8 leading-relaxed">
                Products I&apos;ve designed, built and shipped, plus the open source work behind them.
              </p>

              {/* Visual 2-Column Projects Grid & Open Source Section */}
              <ProjectsSection />

              {renderFooter()}
            </div>
          </div>
        ) : activeSection === 'people' ? (
          <div>
            {/* Sticky Header for People View */}
            <header className="sticky top-0 z-30 flex h-[70px] items-center px-6 lg:px-8 border-b border-line bg-surface/85 backdrop-blur-md">
              <h1 className="text-xl font-bold tracking-tight text-ink">People</h1>
            </header>

            <div className="px-6 py-8 lg:px-8">
              {/* People Hero Banner & Filter Carousel & Cards */}
              <PeopleSection />

              {renderFooter()}
            </div>
          </div>
        ) : activeSection === 'contact' ? (
          <div>
            {/* Sticky Header for Contact View */}
            <header className="sticky top-0 z-30 flex h-[70px] items-center px-6 lg:px-8 border-b border-line bg-surface/85 backdrop-blur-md">
              <h1 className="text-xl font-bold tracking-tight text-ink">Contact</h1>
            </header>

            <div className="px-6 py-8 lg:px-8">
              {/* Contact Hero Banner, Work With Me, Reach Me & Find Me On */}
              <ContactSection />

              {renderFooter()}
            </div>
          </div>
        ) : (
          <div>
            {/* Sticky Desktop Header Bar - Direct Child of <main>, stays sticky throughout all scroll positions */}
            <DesktopStickyHeader
              profile={profile}
              onContactClick={handleContactClick}
              onShareClick={() => setIsShareOpen(true)}
            />

            {/* Profile Hero & Decorative Banner */}
            <ProfileHeader
              profile={profile}
              activeTab={activeTab}
              onTabChange={onTabChange}
              onContactClick={handleContactClick}
            />

            {/* Tab Content */}
            <div className="px-6 py-10 lg:px-8">
              {activeTab === 'resume' ? (
                <>
                  {/* About Section */}
                  <AboutSection />

                  {/* Experience Section */}
                  <ExperienceSection />

                  {/* Skills and Tools Section */}
                  <SkillsSection />
                </>
              ) : (
                /* Work / Repositories & Projects Tab (Screenshots 1, 2, 3) */
                <WorkTabContent onNavigateToProjects={() => onNavigate('projects')} />
              )}

              {renderFooter()}
            </div>
          </div>
        )}
      </main>

      {/* 3. Right Column (Sticky Follow & Socials Sidebar) */}
      <RightSidebar
        onContactClick={handleContactClick}
        activeSection={activeSection}
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
