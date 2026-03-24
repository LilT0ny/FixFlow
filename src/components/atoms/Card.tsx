import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from './Button';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'outline' | 'elevated' | 'glass';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'elevated', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          {
            'bg-white border border-surface-100 shadow-sm': variant === 'elevated',
            'bg-transparent border border-surface-200': variant === 'outline',
            'bg-white/70 backdrop-blur-md border border-white/20 shadow-lg': variant === 'glass',
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
