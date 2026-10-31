'use client';

import React from 'react';
import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { DesktopNavigation } from '@/components/navigation/DesktopNavigation';

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
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col px-3 pb-5 transition-[width] duration-200 md:flex border-r border-line bg-surface/40 ${
        isCollapsed
          ? 'w-19 items-center'
          : 'w-19 items-center xl:w-65 xl:items-stretch xl:px-4'
      }`}
    >
      {/* Brand Logo & Name */}
      <div
        className={`flex h-17.5 shrink-0 items-center ${
          isCollapsed ? 'justify-center' : 'justify-center xl:justify-start xl:px-2'
        }`}
      >
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5"
          aria-label="FolioFrame, home"
        >
          <span className="btn-primary grid size-9 place-items-center rounded-[11px] transition-transform group-hover:rotate-[-4deg] group-active:scale-95 shadow-md">
            <span className="text-lg leading-none font-black tracking-tighter text-black">
              N
            </span>
          </span>

          <span
            className={`text-title font-bold tracking-tight text-ink ${
              isCollapsed ? 'hidden' : 'hidden xl:inline-flex'
            }`}
          >
            nahian<span className="text-ink-3 transition-colors group-hover:text-link">.bd</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <DesktopNavigation
        activeSection={activeSection}
        isCollapsed={isCollapsed}
        onNavigate={onNavigate}
      />

      {/* Bottom Controls */}
      <div
        className={`mt-4 flex shrink-0 flex-col gap-3 ${
          isCollapsed
            ? 'items-center'
            : 'items-center xl:items-start xl:px-2'
        }`}
      >
        <div
          className={`flex gap-2 ${
            isCollapsed
              ? 'flex-col'
              : 'flex-col xl:flex-row'
          }`}
        >
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Sound Toggle */}
          <SoundToggle />

          {/* Sidebar Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar width"
            className="btn btn-secondary grid size-9 place-items-center rounded-full"
          >
            <span className="btn-content">
              {isCollapsed ? (
                <PanelLeftOpen className="size-4.5 text-zinc-300" />
              ) : (
                <PanelLeftClose className="size-4.5 text-zinc-300" />
              )}
            </span>
          </button>
        </div>

        {/* Copyright */}
        <p
          className={`text-meta text-ink-3 ${
            isCollapsed ? 'hidden' : 'hidden xl:block'
          }`}
        >
          © 2026 Al Nahian
        </p>
      </div>
    </aside>
  );
};
