import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500',
            {
              'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20': error,
            },
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';
