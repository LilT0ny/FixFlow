import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

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
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-500/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          {
            'bg-surface-900 text-white hover:bg-surface-800': variant === 'primary',
            'bg-surface-100 text-surface-900 hover:bg-surface-200': variant === 'secondary',
            'bg-danger-600 text-white hover:bg-danger-700': variant === 'danger',
            'bg-success-600 text-white hover:bg-success-700': variant === 'success',
            'bg-warning-600 text-white hover:bg-warning-700': variant === 'warning',
            'text-surface-600 hover:bg-surface-100 hover:text-surface-900': variant === 'ghost',
            'border border-surface-300 bg-white text-surface-700 hover:bg-surface-50 hover:text-surface-900': variant === 'outline',

            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
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
