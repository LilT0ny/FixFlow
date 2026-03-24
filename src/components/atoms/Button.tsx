import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95',
          {
            'bg-primary-600 text-white hover:bg-primary-700 shadow-sm focus:ring-primary-500': variant === 'primary',
            'bg-secondary-600 text-white hover:bg-secondary-700 shadow-sm focus:ring-secondary-500': variant === 'secondary',
            'bg-danger-600 text-white hover:bg-danger-700 shadow-sm focus:ring-danger-500': variant === 'danger',
            'bg-success-600 text-white hover:bg-success-700 shadow-sm focus:ring-success-500': variant === 'success',
            'bg-warning-500 text-white hover:bg-warning-600 shadow-sm focus:ring-warning-500': variant === 'warning',
            'hover:bg-surface-100 text-surface-900 border border-transparent': variant === 'ghost',
            'border border-surface-200 bg-white hover:bg-surface-50 text-surface-900': variant === 'outline',

            'px-3 py-1.5 text-sm': size === 'sm',
            'px-5 py-2.5 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
            'p-2': size === 'icon',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
