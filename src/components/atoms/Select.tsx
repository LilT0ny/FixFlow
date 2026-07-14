import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 appearance-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100',
            {
              'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20': error,
            },
            className
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none">
          <svg className="w-4 h-4 text-surface-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';
