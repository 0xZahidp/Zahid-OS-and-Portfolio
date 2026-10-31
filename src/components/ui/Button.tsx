import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'dark' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'icon' | 'icon-round';
  href?: string;
  target?: string;
  rel?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  href,
  target,
  rel,
  ...props
}) => {
  const baseStyles = 'btn select-none';

  const variantStyles = {
    primary: 'btn-primary',
    dark: 'btn-dark',
    secondary: 'btn-secondary',
    ghost: 'hover:bg-surface-2 text-ink',
  };

  const sizeStyles = {
    sm: 'btn-sm',
    md: 'h-11 px-5 rounded-[14px] text-[15px]',
    icon: 'btn-icon',
    'icon-round': 'btn-icon-round',
  };

  const combinedClasses = twMerge(
    clsx(baseStyles, variantStyles[variant], sizeStyles[size], className)
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel || (target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={combinedClasses}
      >
        <span className="inline-flex items-center gap-2">{children}</span>
      </a>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  );
};
