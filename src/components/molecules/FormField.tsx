import type { ReactNode } from 'react';
import { Label } from '../atoms/Label';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { cn } from '../atoms/Button';

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  charCount?: number;
  maxChars?: number;
}

export const FormField = ({
  label,
  error,
  required,
  children,
  className,
  charCount,
  maxChars,
}: FormFieldProps) => {
  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)}>
      <div className="flex justify-between items-end">
        <Label required={required}>{label}</Label>
        {maxChars !== undefined && (
          <span className={cn('text-xs', charCount === maxChars ? 'text-danger-500' : 'text-surface-500')}>
            {charCount || 0} / {maxChars}
          </span>
        )}
      </div>
      {children}
      <ErrorMessage error={error} />
    </div>
  );
};
