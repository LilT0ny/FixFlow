import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface ErrorMessageProps extends HTMLAttributes<HTMLSpanElement> {
  error?: string;
}

export const ErrorMessage = forwardRef<HTMLSpanElement, ErrorMessageProps>(
  ({ className, error, ...props }, ref) => {
    if (!error) return null;

    return (
      <span
        ref={ref}
        className={cn('text-xs text-danger-600 dark:text-red-400 mt-1 animate-fade-in', className)}
        {...props}
      >
        {error}
      </span>
    );
  }
);
ErrorMessage.displayName = 'ErrorMessage';
