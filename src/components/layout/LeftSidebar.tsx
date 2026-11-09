'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';
import {
  TablerSidebarLeftCollapse,
  TablerSidebarLeftExpand,
} from '@/components/ui/Icons';
import { ZahidLogo } from '@/components/ui/ZahidLogo';

interface LeftSidebarProps {
  activeSection: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (section: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeSection,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
}) => {
  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col transition-[width] duration-200 md:flex border-r border-line bg-surface ${
        isCollapsed
          ? 'w-[4.75rem] items-center px-3 pb-5'
          : 'w-[4.75rem] items-center px-3 pb-5 xl:w-[16.25rem] xl:items-stretch xl:px-4'
      }`}
    >
      {/* Brand Logo & Name */}
      <div
        className={`flex h-[4.375rem] shrink-0 items-center ${
          isCollapsed ? 'justify-center' : 'justify-center xl:justify-start xl:px-2'
        }`}
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-3"
          aria-label="Zahid, home"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-brand-400/40 transition-transform group-hover:rotate-[-4deg] group-active:scale-95">
            <ZahidLogo className="size-6 text-white" />
          </span>

          {!isCollapsed && (
            <span className="hidden text-xl font-bold tracking-tight text-ink xl:inline-flex">
              0xZahidP
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <DesktopNavigation
        activeSection={activeSection}
        isCollapsed={isCollapsed}
        onNavigate={onNavigate}
      />

      {/* Bottom Controls - Three circular buttons & copyright */}
      <div
        className={`mt-4 flex shrink-0 flex-col gap-3 ${
          isCollapsed ? 'items-center' : 'items-center xl:items-start xl:px-2'
        }`}
      >
        <div
          className={`flex gap-2.5 ${
            isCollapsed ? 'flex-col' : 'flex-col xl:flex-row xl:items-center'
          }`}
        >
          {/* Theme Toggle */}
          <ThemeToggle className="btn btn-secondary grid size-9 place-items-center rounded-xl border border-white/[0.08] hover:bg-white/[0.08]" />

          {/* Sound Toggle */}
          <SoundToggle className="btn btn-secondary grid size-9 place-items-center rounded-xl border border-white/[0.08] hover:bg-white/[0.08]" />

          {/* Sidebar Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar width"
            className="btn btn-secondary grid size-9 place-items-center rounded-xl border border-white/[0.08] hover:bg-white/[0.08]"
          >
            {isCollapsed ? (
              <TablerSidebarLeftExpand className="size-4.5 text-ink-2" />
            ) : (
              <>
                <TablerSidebarLeftExpand className="size-4.5 text-ink-2 xl:hidden" />
                <TablerSidebarLeftCollapse className="size-4.5 text-ink-2 hidden xl:block" />
              </>
            )}
          </button>
        </div>

        {/* Copyright */}
        {!isCollapsed && (
          <p className="hidden text-micro text-ink-3 xl:block">
            © {new Date().getFullYear()} Md Zahid Hasan
          </p>
        )}
      </div>
    </aside>
  );
};
