import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'pill' | 'badge' | 'status';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'badge',
  className,
  children,
  ...props
}) => {
  const styles = {
    badge: 'badge',
    pill: 'pill',
    status:
      'inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent ring-1 ring-accent/25 dark:text-accent',
  };

  return (
    <span className={twMerge(clsx(styles[variant], className))} {...props}>
      {children}
    </span>
  );
};

