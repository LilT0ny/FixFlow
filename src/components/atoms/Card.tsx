import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'outline' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          {
            'bg-white border border-surface-200 shadow-xs dark:bg-gray-900 dark:border-gray-800': variant === 'elevated',
            'bg-transparent border border-surface-200 dark:border-gray-700': variant === 'outline',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
