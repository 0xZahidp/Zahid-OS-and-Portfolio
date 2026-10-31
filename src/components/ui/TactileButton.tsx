'use client';

import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'emerald' | 'obsidian' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  wrapClassName?: string;
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  variant = 'emerald',
  size = 'md',
  wrapClassName,
  className,
  children,
  href,
  target,
  rel,
  type = 'button',
  ...props
}) => {
  const isDark = variant === 'dark' || variant === 'obsidian';

  const wrapClasses = twMerge(
    clsx(
      'tactile-button-wrap',
      isDark && 'dark',
      size === 'sm' && 'sm',
      size === 'xs' && 'xs',
      wrapClassName
    )
  );

  const buttonClasses = twMerge(
    clsx(
      'tactile-button',
      isDark && 'dark',
      size === 'sm' && 'sm',
      size === 'xs' && 'xs',
      className
    )
  );

  if (href) {
    return (
      <div className={wrapClasses}>
        <a
          href={href}
          target={target}
          rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
          className={buttonClasses}
        >
          {children}
        </a>
      </div>
    );
  }

  return (
    <div className={wrapClasses}>
      <button type={type} className={buttonClasses} {...props}>
        {children}
      </button>
    </div>
  );
};
