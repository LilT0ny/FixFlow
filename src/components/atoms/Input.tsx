import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400 dark:text-gray-500">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500',
            {
              'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20': error,
              'pl-10': !!icon,
            },
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
