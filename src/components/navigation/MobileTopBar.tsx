'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

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
      {/* Left: Hamburger menu button */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="btn btn-secondary grid size-9 place-items-center rounded-full"
      >
        <span className="btn-content">
          <Menu className="size-4.5" />
        </span>
      </button>

      {/* Right: Theme toggle & Contact button */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <button
          type="button"
          onClick={onContactClick}
          className="btn btn-primary h-8 px-3.5 text-xs font-semibold rounded-xl"
        >
          <span className="btn-content">Contact</span>
        </button>
      </div>
    </header>
  );
};
