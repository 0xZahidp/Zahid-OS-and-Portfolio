'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TablerArrowLeft,
  TablerArrowRight,
  TablerReload,
  TablerLink,
  TablerMoon,
  TablerSun,
  TablerVolume,
  TablerVolumeOff,
  TablerMessageCircle,
} from '@/components/ui/Icons';
import { Check } from 'lucide-react';

interface ContextMenuTargetData {
  selection?: string;
  link?: string;
  image?: string;
  code?: string;
}

export const ContextMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [transformOrigin, setTransformOrigin] = useState<'top left' | 'top right' | 'bottom left' | 'bottom right'>('top left');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [targetData, setTargetData] = useState<ContextMenuTargetData>({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(true);
  const [canGoBack, setCanGoBack] = useState(true);

  const menuRef = useRef<HTMLDivElement | null>(null);

  // Sync theme and sound state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDarkMode(!document.documentElement.classList.contains('light'));
      const soundState = localStorage.getItem('folioframe-sound');
      setIsSoundMuted(soundState !== 'on');
      setCanGoBack(window.history.length > 1);
    }
  }, [isOpen]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setCopiedType(null);
  }, []);

  // Context menu event listener
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Don't intercept if shift key pressed or on input/textarea/select/editable
      const target = e.target as HTMLElement | null;
      if (
        e.shiftKey ||
        !target ||
        target.closest('input, textarea, select, [contenteditable="true"], [data-native-menu]')
      ) {
        closeMenu();
        return;
      }

      e.preventDefault();

      const selection = window.getSelection()?.toString().trim() || '';
      const linkElem = target.closest('a[href]') as HTMLAnchorElement | null;
      const imgElem = target.closest('img') as HTMLImageElement | null;
      const codeElem = target.closest('pre, code') as HTMLElement | null;

      const link = linkElem && !linkElem.href.startsWith('javascript:') ? linkElem.href : undefined;
      const image = imgElem && !link ? imgElem.currentSrc || imgElem.src : undefined;
      const code = codeElem && !selection ? codeElem.textContent || undefined : undefined;

      setTargetData({
        selection: selection || undefined,
        link,
        image,
        code,
      });

      // Calculate position with bounds checking
      const menuWidth = 256;
      const menuHeight = selection || link ? 280 : 225;
      const pX = e.clientX;
      const pY = e.clientY;

      const overflowX = pX + menuWidth > window.innerWidth - 8;
      const overflowY = pY + menuHeight > window.innerHeight - 8;

      const posX = Math.max(8, overflowX ? pX - menuWidth : pX);
      const posY = Math.max(8, overflowY ? pY - menuHeight : pY);

      setPosition({ x: posX, y: posY });
      const originY = overflowY ? 'bottom' : 'top';
      const originX = overflowX ? 'right' : 'left';
      setTransformOrigin(`${originY} ${originX}`);
      setIsOpen(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', closeMenu, { passive: true });
    window.addEventListener('resize', closeMenu, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', closeMenu);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu]);

  if (!isOpen) return null;

  const handleCopy = async (text: string, type: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopiedType(type);
        setTimeout(() => {
          closeMenu();
        }, 600);
      }
    } catch {
      closeMenu();
    }
  };

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      localStorage.setItem('folioframe-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('folioframe-theme', 'light');
    }
    setTimeout(closeMenu, 150);
  };

  const toggleSound = () => {
    const nextMuted = !isSoundMuted;
    setIsSoundMuted(nextMuted);
    localStorage.setItem('folioframe-sound', nextMuted ? 'off' : 'on');
    setTimeout(closeMenu, 150);
  };

  const scrollToContact = () => {
    closeMenu();
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Custom Page Menu"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transformOrigin,
      }}
      className="fixed z-[100] w-64 rounded-2xl shadow-2xl transition-[opacity,transform] duration-150 ease-out outline-none animate-in fade-in zoom-in-95"
    >
      <div className="p-1.5 rounded-2xl border border-line bg-surface/95 backdrop-blur-xl shadow-2xl text-ink">
        {/* 1. Top Row: Back, Forward, Reload, Copy Link */}
        <div className="grid grid-cols-4 gap-1" role="group" aria-label="Navigation">
          <button
            type="button"
            role="menuitem"
            disabled={!canGoBack}
            onClick={() => {
              window.history.back();
              closeMenu();
            }}
            className="group/item flex flex-col items-center gap-1 rounded-xl py-2 text-micro font-medium text-ink-2 outline-none transition-colors hover:bg-brand-500/10 hover:text-ink disabled:pointer-events-none disabled:opacity-35 cursor-pointer"
          >
            <TablerArrowLeft className="size-5 transition-colors group-hover/item:text-brand-500" />
            <span>Back</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              window.history.forward();
              closeMenu();
            }}
            className="group/item flex flex-col items-center gap-1 rounded-xl py-2 text-micro font-medium text-ink-2 outline-none transition-colors hover:bg-brand-500/10 hover:text-ink cursor-pointer"
          >
            <TablerArrowRight className="size-5 transition-colors group-hover/item:text-brand-500" />
            <span>Forward</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              window.location.reload();
              closeMenu();
            }}
            className="group/item flex flex-col items-center gap-1 rounded-xl py-2 text-micro font-medium text-ink-2 outline-none transition-colors hover:bg-brand-500/10 hover:text-ink cursor-pointer"
          >
            <TablerReload className="size-5 transition-colors group-hover/item:text-brand-500" />
            <span>Reload</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => handleCopy(window.location.href, 'page')}
            className="group/item flex flex-col items-center gap-1 rounded-xl py-2 text-micro font-medium text-ink-2 outline-none transition-colors hover:bg-brand-500/10 hover:text-ink cursor-pointer"
          >
            {copiedType === 'page' ? (
              <Check className="size-5 text-brand-500" />
            ) : (
              <TablerLink className="size-5 transition-colors group-hover/item:text-brand-500" />
            )}
            <span>{copiedType === 'page' ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>

        {/* Dynamic Selection Item */}
        {targetData.selection && (
          <>
            <div className="my-1.5 h-px bg-line" role="separator" />
            <button
              type="button"
              role="menuitem"
              onClick={() => handleCopy(targetData.selection || '', 'selection')}
              className="group/item flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-2 text-left text-body font-medium text-ink outline-none transition-colors hover:bg-brand-500/10"
            >
              <span className="flex-1 truncate">
                {copiedType === 'selection' ? 'Copied!' : 'Copy selection'}
              </span>
              <kbd className="text-micro text-ink-3">Ctrl+C</kbd>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(targetData.selection || '')}`,
                  '_blank',
                  'noopener'
                );
                closeMenu();
              }}
              className="group/item flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-2 text-left text-body font-medium text-ink outline-none transition-colors hover:bg-brand-500/10"
            >
              <span className="flex-1 truncate">
                Search &ldquo;{targetData.selection.slice(0, 16)}&hellip;&rdquo;
              </span>
            </button>
          </>
        )}

        {/* Dynamic Link Item */}
        {targetData.link && (
          <>
            <div className="my-1.5 h-px bg-line" role="separator" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                window.open(targetData.link, '_blank', 'noopener');
                closeMenu();
              }}
              className="group/item flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-2 text-left text-body font-medium text-ink outline-none transition-colors hover:bg-brand-500/10"
            >
              <span className="flex-1 truncate">Open link in new tab</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => handleCopy(targetData.link || '', 'link')}
              className="group/item flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-2 text-left text-body font-medium text-ink outline-none transition-colors hover:bg-brand-500/10"
            >
              <span className="flex-1 truncate">
                {copiedType === 'link' ? 'Copied link address!' : 'Copy link address'}
              </span>
            </button>
          </>
        )}

        <div className="my-1.5 h-px bg-line" role="separator" />

        {/* 2. Theme Toggle Row */}
        <button
          type="button"
          role="menuitem"
          onClick={toggleTheme}
          className="group/item flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-1.5 text-left text-body font-medium text-ink outline-none transition-colors hover:bg-brand-500/10"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-2 ring-1 ring-line transition-colors group-hover/item:bg-brand-600 group-hover/item:text-white group-hover/item:ring-brand-600">
            {isDarkMode ? (
              <TablerSun className="size-4" />
            ) : (
              <TablerMoon className="size-4" />
            )}
          </span>
          <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
        </button>

        {/* 3. Sound Toggle Row */}
        <button
          type="button"
          role="menuitem"
          onClick={toggleSound}
          className="group/item flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-1.5 text-left text-body font-medium text-ink outline-none transition-colors hover:bg-brand-500/10"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-ink-2 ring-1 ring-line transition-colors group-hover/item:bg-brand-600 group-hover/item:text-white group-hover/item:ring-brand-600">
            {isSoundMuted ? (
              <TablerVolumeOff className="size-4" />
            ) : (
              <TablerVolume className="size-4" />
            )}
          </span>
          <span>{isSoundMuted ? 'Turn sounds on' : 'Mute sounds'}</span>
        </button>

        <div className="my-1.5 h-px bg-line" role="separator" />

        {/* 4. Get In Touch Row */}
        <button
          type="button"
          role="menuitem"
          onClick={scrollToContact}
          className="group/item flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-1.5 text-left text-body font-medium outline-none transition-colors hover:bg-brand-500/10"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-surface-2 text-emerald-600 ring-1 ring-line transition-colors group-hover/item:bg-brand-600 group-hover/item:text-white group-hover/item:ring-brand-600">
            <TablerMessageCircle className="size-4" />
          </span>
          <span className="flex-1 font-semibold text-emerald-600 dark:text-emerald-400">
            Get in touch
          </span>
          <span className="pr-1 text-emerald-600 dark:text-emerald-400 font-bold transition-transform group-hover/item:translate-x-0.5">
            →
          </span>
        </button>
      </div>
    </div>
  );
};
