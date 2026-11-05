'use client';

import React from 'react';
import { TablerMenu2 } from '@/components/ui/Icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ZahidLogo } from '@/components/ui/ZahidLogo';

interface MobileTopBarProps {
  onOpenMenu: () => void;
  onContactClick: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  onOpenMenu,
  onContactClick,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur-md md:hidden">
      {/* Left: Hamburger menu button & Brand */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="btn btn-secondary grid size-9 place-items-center rounded-full"
        >
          <span className="btn-content">
            <TablerMenu2 className="size-4.5" />
          </span>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-7.5 place-items-center rounded-lg bg-gradient-to-b from-brand-500 to-brand-700 shadow-xs ring-1 ring-brand-400/40 text-white">
            <ZahidLogo className="size-4.5 text-white" />
          </span>
          <span className="text-sm font-bold tracking-tight text-ink">0xZahidP</span>
        </Link>
      </div>

      {/* Right: Theme toggle & Contact button */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button
          variant="primary"
          size="sm"
          onClick={onContactClick}
          className="rounded-[12px] h-9 px-4 text-xs font-semibold"
        >
          Contact
        </Button>
      </div>
    </header>
  );
};
