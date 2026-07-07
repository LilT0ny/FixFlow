import React from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  uppercase?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-700 border-surface-200',
  success: 'bg-success-50 text-success-700 border-success-100',
  warning: 'bg-warning-50 text-warning-700 border-warning-100',
  danger: 'bg-danger-50 text-danger-700 border-danger-100',
  info: 'bg-primary-50 text-primary-700 border-primary-100',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
  uppercase = false
}) => {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border",
      variantStyles[variant],
      uppercase && "uppercase tracking-wide",
      className
    )}>
      {children}
    </span>
  );
};
