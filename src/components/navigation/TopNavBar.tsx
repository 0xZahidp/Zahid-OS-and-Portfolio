'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { ZahidLogo } from '@/components/ui/ZahidLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { PremiumFlipButton } from '@/components/ui/PremiumFlipButton';

interface TopNavBarProps {
  onContactClick?: () => void;
  onOpenMobileMenu?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onContactClick,
  onOpenMobileMenu,
}) => {
  const navItems = [
    { href: '#work', label: 'Work' },
    { href: '#experience', label: 'Experience' },
    { href: '#skills', label: 'Skills' },
    { href: '#connect', label: 'Connect' },
  ];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleContactAction = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      const el = document.querySelector('#connect');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-line bg-surface/90 backdrop-blur-md transition-colors select-none">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Left: Brand Logo & 0xZahidP */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 text-text hover:text-accent transition-colors group cursor-pointer"
        >
          <div className="size-8 rounded-lg bg-accent grid place-items-center shadow-xs text-white group-hover:scale-105 transition-transform">
            <ZahidLogo className="size-4.5" />
          </div>
          <span className="font-bold tracking-tight text-base text-text group-hover:text-accent transition-colors">
            0xZahidP
          </span>
        </a>

        {/* Center: Desktop Anchor Links (hidden md:flex items-center gap-6) */}
        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleScrollTo(e, item.href)}
              className="text-sm font-medium text-muted hover:text-text transition-colors cursor-pointer"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Theme Toggle + "Get in touch" Button */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle */}
          <ThemeToggle className="btn btn-secondary size-9 grid place-items-center rounded-xl" />

          {/* Primary "Get in touch" Button */}
          <div className="hidden sm:block">
            <PremiumFlipButton
              textOne="Get in touch"
              textTwo="Let's talk →"
              onClick={handleContactAction}
              size="sm"
            />
          </div>

          {/* Mobile Hamburger Button */}
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Open navigation menu"
              className="md:hidden grid size-9 place-items-center rounded-xl border border-line bg-surface-2 text-text hover:bg-surface-3 transition-colors cursor-pointer"
            >
              <Menu className="size-4.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
