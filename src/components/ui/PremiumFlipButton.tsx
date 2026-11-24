/*
From Uiverse.io by mobinkakei - https://uiverse.io/mobinkakei/ancient-goose-30
MIT License, Copyright (c) mobinkakei (Mobeen)

From Uiverse.io by Mubashir222 - https://uiverse.io/Mubashir222/fuzzy-owl-53
MIT License, Copyright (c) Mubashir222 (Mubashir Iftikhar)
*/

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PremiumFlipButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  textOne?: string;
  textTwo?: string;
  icon?: React.ReactNode;
  iconTwo?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'copper' | 'surface';
  asLink?: boolean;
  href?: string;
  target?: string;
  rel?: string;
}

export const PremiumFlipButton: React.FC<PremiumFlipButtonProps> = ({
  textOne = 'Hover me',
  textTwo = 'Great!',
  icon,
  iconTwo,
  size = 'md',
  variant = 'primary',
  className,
  asLink = false,
  href,
  target,
  rel,
  children,
  onClick,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-8 px-4 text-xs gap-1.5',
    md: 'h-10 px-5 text-xs sm:text-sm gap-2',
    lg: 'h-12 px-6.5 text-sm sm:text-base gap-2.5',
  }[size];

  const variantBaseClasses = {
    // Primary: Obsidian/Charcoal with Copper/Amber expanding ripple
    primary:
      'bg-[#18181B] text-zinc-100 border border-white/10 dark:bg-[#17171A] dark:border-[#27272C] shadow-md hover:shadow-lg hover:shadow-accent/20',
    // Copper: Deep copper base that transitions to darker rich copper on hover
    copper:
      'bg-accent text-white dark:text-[#0E0E10] border border-accent-hover shadow-md hover:shadow-lg shadow-accent/25',
    // Surface: Clean elevated stone card surface that lights up on hover
    surface:
      'bg-surface-2 text-ink border border-line shadow-xs hover:border-line-strong',
  }[variant];

  const content = (
    <>
      {/* 1. Expanding Radial Ripple Layer (Mubashir222 - fuzzy-owl-53) */}
      <span
        aria-hidden="true"
        className="absolute w-0 h-0 transition-all duration-500 ease-out rounded-full bg-accent group-hover:w-80 group-hover:h-80 pointer-events-none"
      />

      {/* 2. Left Bottom Decorative SVG Accent */}
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-full -ml-2 pointer-events-none select-none transition-opacity duration-300 group-hover:opacity-40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-auto h-full opacity-10 object-stretch"
          viewBox="0 0 487 487"
        >
          <path
            fillOpacity=".25"
            fillRule="nonzero"
            fill="#FFF"
            d="M0 .3c67 2.1 134.1 4.3 186.3 37 52.2 32.7 89.6 95.8 112.8 150.6 23.2 54.8 32.3 101.4 61.2 149.9 28.9 48.4 77.7 98.8 126.4 149.2H0V.3z"
          />
        </svg>
      </span>

      {/* 3. Right Top Decorative SVG Accent */}
      <span
        aria-hidden="true"
        className="absolute top-0 right-0 w-12 h-full -mr-3 pointer-events-none select-none transition-opacity duration-300 group-hover:opacity-40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="object-cover w-full h-full opacity-10"
          viewBox="0 0 487 487"
        >
          <path
            fillOpacity=".25"
            fillRule="nonzero"
            fill="#FFF"
            d="M487 486.7c-66.1-3.6-132.3-7.3-186.3-37s-95.9-85.3-126.2-137.2c-30.4-51.8-49.3-99.9-76.5-151.4C70.9 109.6 35.6 54.8.3 0H487v486.7z"
          />
        </svg>
      </span>

      {/* 4. Subtle Specular Highlight / Glass Sheen Overlay */}
      <span
        aria-hidden="true"
        className="absolute inset-0 w-full h-full -mt-0.5 rounded-full opacity-35 bg-gradient-to-b from-white/20 via-transparent to-black/25 pointer-events-none"
      />

      {/* 5. Dual-Text Rolling Vertical Swap Animation (mobinkakei - ancient-goose-30) */}
      <span className="relative z-10 flex flex-col items-center justify-center h-5 overflow-hidden">
        {/* Resting Text (rolls up on hover) */}
        <span className="flex items-center gap-1.5 transition-transform duration-500 ease-out group-hover:-translate-y-full">
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="font-semibold tracking-wide">{children || textOne}</span>
        </span>

        {/* Hovered Text (rolls in from bottom) with Guaranteed Contrast */}
        <span className="absolute flex items-center gap-1.5 transition-transform duration-500 ease-out translate-y-full group-hover:translate-y-0 font-bold tracking-wide text-white dark:text-[#0E0E10]">
          <span>{textTwo}</span>
          {(iconTwo || icon) && <span className="shrink-0">{iconTwo || icon}</span>}
        </span>
      </span>
    </>
  );

  const sharedClasses = cn(
    'group relative inline-flex items-center justify-center overflow-hidden rounded-full',
    'font-medium transition-all duration-300 select-none cursor-pointer',
    'active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
    sizeClasses,
    variantBaseClasses,
    className
  );

  if (asLink && href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        className={sharedClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedClasses}
      {...props}
    >
      {content}
    </button>
  );
};
