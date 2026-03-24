import { forwardRef } from 'react';
import type { LabelHTMLAttributes } from 'react';
import { cn } from './Button';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-sm font-medium text-surface-700', className)}
        {...props}
      >
        {children}
        {required && <span className="text-danger-500 ml-1">*</span>}
      </label>
    );
  }
);
Label.displayName = 'Label';
