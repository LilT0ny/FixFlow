import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cn } from './Button';

export interface ErrorMessageProps extends HTMLAttributes<HTMLSpanElement> {
  error?: string;
}

export const ErrorMessage = forwardRef<HTMLSpanElement, ErrorMessageProps>(
  ({ className, error, ...props }, ref) => {
    if (!error) return null;

    return (
      <span
        ref={ref}
        className={cn('text-xs text-danger-500 mt-1', className)}
        {...props}
      >
        {error}
      </span>
    );
  }
);
ErrorMessage.displayName = 'ErrorMessage';
