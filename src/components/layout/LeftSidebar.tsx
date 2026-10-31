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
          ? 'w-19 items-center px-3 pb-5'
          : 'w-[260px] items-stretch px-4 pb-5'
      }`}
    >
      {/* Brand Logo & Name */}
      <div
        className={`flex h-[70px] shrink-0 items-center ${
          isCollapsed ? 'justify-center' : 'justify-start px-2'
        }`}
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-3"
          aria-label="Zahid, home"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/40 transition-transform group-hover:rotate-[-4deg] group-active:scale-95">
            <span className="text-xl leading-none font-black tracking-tighter text-white">
              Z
            </span>
          </span>

          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-ink">
              zahid<span className="text-ink-3 transition-colors group-hover:text-link">.dev</span>
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

      {/* Bottom Controls - Three 44px circular buttons & copyright */}
      <div
        className={`mt-4 flex shrink-0 flex-col gap-3 ${
          isCollapsed ? 'items-center' : 'items-start px-2'
        }`}
      >
        <div
          className={`flex gap-2.5 ${
            isCollapsed ? 'flex-col' : 'flex-row items-center'
          }`}
        >
          {/* Theme Toggle */}
          <ThemeToggle className="size-11" />

          {/* Sound Toggle */}
          <SoundToggle className="size-11" />

          {/* Sidebar Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar width"
            className="btn-secondary grid size-11 place-items-center rounded-full hover:border-line-strong transition-all cursor-pointer"
          >
            {isCollapsed ? (
              <TablerSidebarLeftExpand className="size-5 text-ink-2" />
            ) : (
              <TablerSidebarLeftCollapse className="size-5 text-ink-2" />
            )}
          </button>
        </div>

        {/* Copyright */}
        {!isCollapsed && (
          <p className="text-xs text-ink-3">
            © 2026 Zahid
          </p>
        )}
      </div>
    </aside>
  );
};
