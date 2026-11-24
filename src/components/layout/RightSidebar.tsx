'use client';

import React from 'react';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { getPlatformIcon } from '@/components/ui/Icons';
import { VisitorWeatherCard } from '@/components/ui/VisitorWeatherCard';
import { PremiumFlipButton } from '@/components/ui/PremiumFlipButton';

interface RightSidebarProps {
  onContactClick: () => void;
  onNavigate?: (section: string) => void;
  activeSection?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onContactClick,
  activeSection = 'profile',
}) => {
  const { content } = usePortfolio();
  const socialLinksData = Array.isArray(content.socialLinks) ? content.socialLinks : [];

  const defaultSocials = [
    { id: 'def-github', platform: 'github', label: 'GitHub', handle: '@0xZahidp', url: 'https://github.com/0xZahidp' },
    { id: 'def-x', platform: 'x', label: 'X', handle: '@0xZahidP', url: 'https://x.com/0xZahidP' },
    { id: 'def-linkedin', platform: 'linkedin', label: 'LinkedIn', handle: 'in/0xZahidp', url: 'https://linkedin.com/in/0xZahidp' },
    { id: 'def-telegram', platform: 'telegram', label: 'Telegram', handle: '@0xZahidP', url: 'https://t.me/0xZahidP' },
  ];

  const socials = socialLinksData.length > 0 ? socialLinksData : defaultSocials;

  return (
    <aside className="sticky top-20 flex flex-col gap-6 w-full lg:w-80 shrink-0">
      {/* 1. Live Weather & Time Card */}
      <VisitorWeatherCard />

      {/* 2. Direct Collaboration / Available for Hire Card */}
      {activeSection !== 'contact' && (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2 shrink-0" aria-hidden="true">
              <span className="absolute inline-flex size-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            <h3 className="text-sm font-semibold tracking-tight text-text">
              Direct Collaboration
            </h3>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-muted">
            Product developer &amp; full-stack engineer building resilient web systems, offline-first apps, and high-impact software. Open for contracts and consulting.
          </p>

          <div className="mt-4">
            <PremiumFlipButton
              textOne="Get in touch"
              textTwo="Start a conversation →"
              onClick={onContactClick}
              size="sm"
            />
          </div>
        </div>
      )}

      {/* 3. Find me on — Compact 2x2 Grid */}
      {activeSection !== 'contact' && (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            Find me on
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {socials.slice(0, 4).map((social) => (
              <a
                key={social.id || social.url}
                href={social.url}
                target="_blank"
                rel="me noopener noreferrer"
                className="group flex items-center justify-between p-2.5 rounded-xl border border-line bg-surface-2/40 hover:border-accent/60 hover:bg-surface-2 transition-all text-muted hover:text-text cursor-pointer"
                title={social.label || social.platform}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-text">
                    {getPlatformIcon(social.platform, social.url, 'size-3.5')}
                  </span>
                  <span className="text-xs font-medium truncate">
                    {social.label || social.platform}
                  </span>
                </div>
                <ArrowUpRight className="size-3 text-muted/60 group-hover:text-accent transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 4. DMCA Protected Badge */}
      <div className="flex items-center gap-2 text-[11px] text-muted px-1">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-1 font-semibold text-accent ring-1 ring-accent/20">
          <ShieldCheck className="size-3.5" />
          DMCA PROTECTED
        </span>
        <span>Original Identity</span>
      </div>
    </aside>
  );
};
