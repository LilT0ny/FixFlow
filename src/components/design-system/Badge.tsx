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
  default: 'bg-surface-100 text-surface-600 border-surface-200',
  success: 'bg-success-50 text-success-600 border-success-100',
  warning: 'bg-warning-50 text-warning-600 border-warning-100',
  danger: 'bg-danger-50 text-danger-600 border-danger-100',
  info: 'bg-primary-50 text-primary-600 border-primary-100',
};

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default',
  className,
  uppercase = true
}) => {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border",
      variantStyles[variant],
      uppercase && "uppercase tracking-widest",
      className
    )}>
      {children}
    </span>
  );
};
