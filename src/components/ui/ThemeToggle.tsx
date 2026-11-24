'use client';

import React from 'react';
import { AnimatedThemeToggler, TransitionVariant } from '@/components/ui/animated-theme-toggler';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: TransitionVariant;
  duration?: number;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  variant = 'circle',
  duration = 450,
}) => {
  return (
    <AnimatedThemeToggler
      variant={variant}
      duration={duration}
      className={cn(
        'btn btn-secondary grid size-9 place-items-center rounded-xl transition-transform active:scale-95',
        className
      )}
    />
  );
};


