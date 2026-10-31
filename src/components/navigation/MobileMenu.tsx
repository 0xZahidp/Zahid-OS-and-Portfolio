'use client';

import React from 'react';
import Link from 'next/link';
import {
  X,
  User,
  Box,
  Users,
  Mail,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SoundToggle } from '@/components/ui/SoundToggle';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  FacebookIcon,
} from '@/components/ui/Icons';

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
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'projects', label: 'Projects', icon: Box },
    { id: 'people', label: 'People', icon: Users },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'focus', label: 'Focus', icon: Headphones },
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
            <span className="btn-primary grid size-9 place-items-center rounded-[11px] shadow-md">
              <span className="text-lg leading-none font-black tracking-tighter text-black">
                N
              </span>
            </span>
            <span className="text-title font-bold tracking-tight text-ink">
              nahian<span className="text-ink-3">.bd</span>
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
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
              href="https://github.com/alnahian2003"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-ink transition-colors"
            >
              <GitHubIcon className="size-4" />
            </a>
            <a
              href="https://x.com/alnahian2003"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="hover:text-ink transition-colors"
            >
              <XIcon className="size-4" />
            </a>
            <a
              href="https://linkedin.com/in/alnahian2003"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-ink transition-colors"
            >
              <LinkedInIcon className="size-4" />
            </a>
            <a
              href="https://facebook.com/alnahian2003"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-ink transition-colors"
            >
              <FacebookIcon className="size-4" />
            </a>
          </div>

          <p className="text-[11px] text-ink-3">© 2026 Al Nahian</p>
        </div>
      </div>
    </div>
  );
};
