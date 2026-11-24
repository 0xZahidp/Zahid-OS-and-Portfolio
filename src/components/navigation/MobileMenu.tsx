'use client';

import React from 'react';
import Link from 'next/link';
import { X, Briefcase, Layers, Target, Mail } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  GitHubIcon,
  XIcon,
  LinkedInIcon,
  TelegramIcon,
} from '@/components/ui/Icons';
import { ZahidLogo } from '@/components/ui/ZahidLogo';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const navItems = [
    { href: '#work', label: 'Work', icon: Layers },
    { href: '#experience', label: 'Experience', icon: Briefcase },
    { href: '#skills', label: 'Skills', icon: Target },
    { href: '#connect', label: 'Connect', icon: Mail },
  ];

  const handleNavClick = (href: string) => {
    onClose();
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

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
            <span className="grid size-9 place-items-center rounded-xl bg-accent text-white shadow-xs">
              <ZahidLogo className="size-5 fill-current" />
            </span>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold tracking-tight text-text leading-tight">
                0xZahidP
              </span>
              <span className="text-[10px] font-mono text-muted">
                Software Engineer
              </span>
            </div>
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
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium text-text hover:bg-surface-2 transition-colors text-left cursor-pointer"
              >
                <Icon className="size-5 text-muted" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Socials & Theme Toggle at bottom */}
        <div className="pt-6 border-t border-line space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Appearance</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-4 text-muted">
            <a
              href="https://t.me/0xZahidP"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="hover:text-text transition-colors"
            >
              <TelegramIcon className="size-4" />
            </a>
            <a
              href="https://github.com/0xZahidp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="hover:text-text transition-colors"
            >
              <GitHubIcon className="size-4" />
            </a>
            <a
              href="https://x.com/0xZahidP"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="hover:text-text transition-colors"
            >
              <XIcon className="size-4" />
            </a>
            <a
              href="https://linkedin.com/in/0xZahidp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-text transition-colors"
            >
              <LinkedInIcon className="size-4" />
            </a>
          </div>

          <p className="text-[11px] text-muted">© 2026 Md Zahid Hasan</p>
        </div>
      </div>
    </div>
  );
};
