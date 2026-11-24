'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldCheck } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Profile } from '@/types/profile';
import { TopNavBar } from '@/components/navigation/TopNavBar';
import { MobileMenu } from '@/components/navigation/MobileMenu';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProjectsSection } from '@/components/sections/ProjectsSection';
import { AboutSection } from '@/components/sections/AboutSection';
import { ExperienceSection } from '@/components/sections/ExperienceSection';
import { SkillsSection } from '@/components/sections/SkillsSection';
import { ContactSection } from '@/components/sections/ContactSection';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  TelegramIcon,
} from '@/components/ui/Icons';

const ShareModal = dynamic(
  () => import('@/components/ui/ShareModal').then((m) => m.ShareModal),
  { ssr: false }
);

interface DesktopLayoutProps {
  profile: Profile;
  activeSection?: string;
  activeTab?: 'resume' | 'work';
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: (section: string) => void;
  onTabChange?: (tab: 'resume' | 'work') => void;
}

export const DesktopLayout: React.FC<DesktopLayoutProps> = ({
  profile,
}) => {
  const { content } = usePortfolio();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleContactClick = () => {
    const el = document.querySelector('#connect');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-bg text-text" suppressHydrationWarning>
      {/* 1. Sticky Top Navigation Bar */}
      <TopNavBar
        onContactClick={handleContactClick}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Drawer Sheet */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. One Centered Column (max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-12) */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Hero Section */}
        <ProfileHeader
          profile={profile || content.profile}
          onContactClick={handleContactClick}
        />

        {/* Selected Work (First) */}
        <ProjectsSection />

        {/* About + Working Style + Languages */}
        <AboutSection />

        {/* Experience (with collapsed Web3 block) */}
        <ExperienceSection />

        {/* Skills (Shown once, grouped into 4 categories) */}
        <SkillsSection />

        {/* Connect (Full-width original CTA + message + links) */}
        <ContactSection />

        {/* Footer with DMCA badge moved here small */}
        <footer className="pt-10 pb-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted">
          <div className="flex items-center gap-3">
            <span>© {new Date().getFullYear()} Md Zahid Hasan · 0xZahidP</span>
            <span>·</span>
            {/* DMCA Badge (Moved to footer, small) */}
            <span className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-mono text-muted border border-line">
              <ShieldCheck className="size-3 text-accent" />
              <span>DMCA Protected</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-muted">
            <a
              href="https://t.me/0xZahidP"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="hover:text-text transition-colors"
            >
              <TelegramIcon className="size-3.5" />
            </a>
            <a
              href="https://github.com/0xZahidp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-text transition-colors"
            >
              <GitHubIcon className="size-3.5" />
            </a>
            <a
              href="https://x.com/0xZahidP"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="hover:text-text transition-colors"
            >
              <XIcon className="size-3" />
            </a>
            <a
              href="https://linkedin.com/in/0xZahidp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-text transition-colors"
            >
              <LinkedInIcon className="size-3.5" />
            </a>
          </div>
        </footer>
      </main>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        profile={profile || content.profile}
      />
    </div>
  );
};
