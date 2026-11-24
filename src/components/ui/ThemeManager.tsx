'use client';

import { useEffect } from 'react';

export const toggleGlobalTheme = (coords?: { x: number; y: number } | HTMLElement) => {
  const isLight = document.documentElement.classList.contains('light');
  const nextTheme = isLight ? 'dark' : 'light';

  const applyTheme = () => {
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

  if (typeof document.startViewTransition !== 'function') {
    applyTheme();
    return;
  }

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let x = viewportWidth / 2;
  let y = viewportHeight / 2;

  if (coords && 'x' in coords && 'y' in coords) {
    x = coords.x;
    y = coords.y;
  } else if (coords && typeof (coords as HTMLElement).getBoundingClientRect === 'function') {
    const rect = (coords as HTMLElement).getBoundingClientRect();
    x = rect.left + rect.width / 2;
    y = rect.top + rect.height / 2;
  }

  const maxRadius = Math.hypot(
    Math.max(x, viewportWidth - x),
    Math.max(y, viewportHeight - y)
  );

  const toX = (val: number) => `${(val / viewportWidth) * 100}%`;
  const toY = (val: number) => `${(val / viewportHeight) * 100}%`;
  const toRadius = (r: number) =>
    `${(r / (Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2)) * 100}%`;

  const clipPath = [
    `circle(0% at ${toX(x)} ${toY(y)})`,
    `circle(${toRadius(maxRadius)} at ${toX(x)} ${toY(y)})`,
  ];

  const root = document.documentElement;
  root.dataset.magicuiThemeVt = 'active';
  root.style.setProperty('--magicui-theme-vt-clip-from', clipPath[0]);

  const cleanup = () => {
    delete root.dataset.magicuiThemeVt;
    root.style.removeProperty('--magicui-theme-vt-clip-from');
  };

  try {
    const transition = document.startViewTransition(() => {
      applyTheme();
    });

    if (transition && typeof transition.finished?.finally === 'function') {
      transition.finished.finally(cleanup).catch(() => {});
    } else {
      cleanup();
    }

    if (transition?.ready && typeof transition.ready.then === 'function') {
      transition.ready
        .then(() => {
          root.animate(
            { clipPath },
            {
              duration: 450,
              easing: 'ease-in-out',
              fill: 'forwards',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {});
    }
  } catch {
    cleanup();
    applyTheme();
  }
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

