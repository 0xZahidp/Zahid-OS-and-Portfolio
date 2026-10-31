'use client';

import React, { useEffect, useState } from 'react';
import { TablerMoon, TablerSun } from '@/components/ui/Icons';
import { toggleGlobalTheme } from './ThemeManager';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('folioframe-theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(document.documentElement.classList.contains('light') ? 'light' : 'dark');
    }

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<'dark' | 'light'>;
      setTheme(customEvent.detail);
    };

    window.addEventListener('folioframe-theme-change', handleThemeChange);
    return () => window.removeEventListener('folioframe-theme-change', handleThemeChange);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={`btn btn-secondary grid size-9 place-items-center rounded-full transition-transform active:scale-95 ${className}`}
      >
        <TablerSun className="size-4.5 text-zinc-300" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleGlobalTheme}
      aria-label={`Toggle theme (currently ${theme}, press Space to toggle)`}
      title="Toggle theme (Space)"
      className={`btn btn-secondary grid size-9 place-items-center rounded-full transition-transform active:scale-95 ${className}`}
    >
      <span className="btn-content">
        {theme === 'dark' ? (
          <TablerSun className="size-4.5 text-zinc-300 hover:text-amber-400 transition-colors" />
        ) : (
          <TablerMoon className="size-4.5 text-zinc-700 hover:text-indigo-600 transition-colors" />
        )}
      </span>
    </button>
  );
};

