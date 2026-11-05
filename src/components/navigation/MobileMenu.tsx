'use client';

import React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import {
  TablerUserCircle,
  TablerBox,
  TablerUsers,
  TablerMail,
  TablerBooks,
  TablerHeadphones,
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
} from '@/components/ui/Icons';
import { ZahidLogo } from '@/components/ui/ZahidLogo';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  if (!isOpen) return null;

  const handleNavClick = (section: string) => {
    onNavigate(section);
    onClose();
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: TablerUserCircle },
    { id: 'projects', label: 'Projects', icon: TablerBox },
    { id: 'people', label: 'People', icon: TablerUsers },
    { id: 'contact', label: 'Contact', icon: TablerMail },
    { id: 'library', label: 'Library', icon: TablerBooks },
    { id: 'focus', label: 'Focus', icon: TablerHeadphones },
  ];

  return (
    <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative flex w-full max-w-xs flex-1 flex-col bg-surface p-6 shadow-2xl border-r border-line animate-slideRight">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={onClose}
            className="group inline-flex items-center gap-2.5"
          >
            <span className="grid size-9 place-items-center rounded-[11px] bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/40">
              <ZahidLogo className="size-5 text-white" />
            </span>
            <span className="text-title font-bold tracking-tight text-ink">
              0xZahidP
            </span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="btn btn-secondary grid size-9 place-items-center rounded-full"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="mt-8 flex flex-col gap-1.5 flex-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                data-note={idx}
                onClick={() => handleNavClick(item.id)}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-lead font-medium text-ink hover:bg-surface-2 transition-colors text-left"
              >
                <Icon className="size-5 text-ink-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Socials & Theme Toggle at bottom */}
        <div className="pt-6 border-t border-line space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-3">Theme & Audio</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SoundToggle />
            </div>
          </div>

          <div className="flex items-center gap-3 text-ink-3">
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
              href="https://facebook.com/0xZahidp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-ink transition-colors"
            >
              <FacebookIcon className="size-4" />
            </a>
          </div>

          <p className="text-[11px] text-ink-3">© 2026 Zahid</p>
        </div>
      </div>
    </div>
  );
};
