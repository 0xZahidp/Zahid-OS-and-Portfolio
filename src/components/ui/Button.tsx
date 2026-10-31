import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'btn select-none';
  
  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'hover:bg-surface text-ink',
  };

  const sizeStyles = {
    sm: 'h-8 px-3.5 text-xs rounded-xl',
    md: 'h-10 px-4.5 text-sm rounded-xl',
    lg: 'h-11 px-5 text-base rounded-xl',
    icon: 'grid size-9 place-items-center rounded-full',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variantStyles[variant], sizeStyles[size], className))}
      {...props}
    >
      <span className="btn-content inline-flex items-center gap-2">{children}</span>
    </button>
  );
};

