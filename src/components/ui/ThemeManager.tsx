'use client';

import { useEffect } from 'react';

export const toggleGlobalTheme = () => {
  const isLight = document.documentElement.classList.contains('light');
  const nextTheme = isLight ? 'dark' : 'light';

  if (nextTheme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }

  localStorage.setItem('folioframe-theme', nextTheme);
  window.dispatchEvent(
    new CustomEvent('folioframe-theme-change', { detail: nextTheme })
  );
};

export const ThemeManager = () => {
  useEffect(() => {
    // Initial theme load
    const savedTheme = localStorage.getItem('folioframe-theme') as 'dark' | 'light' | null;
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }

    // Space bar listener to switch theme
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        const target = e.target as HTMLElement | null;
        // Don't trigger if user is interacting with form controls or content editable
        const isInteractive = target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"], dialog'
        );
        if (isInteractive) return;

        e.preventDefault();
        toggleGlobalTheme();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
};

