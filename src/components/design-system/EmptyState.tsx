import React from 'react';
import { cn } from '../../lib/cn';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn(
      "col-span-full border border-dashed border-surface-300 rounded-xl py-16 px-8 text-center flex flex-col justify-center items-center bg-surface-50/50 animate-scale-in",
      className
    )}>
      <div className="w-12 h-12 bg-surface-100 text-surface-400 rounded-full flex items-center justify-center mb-4">
        {icon || <Search className="w-5 h-5" />}
      </div>
      <h3 className="text-base font-semibold text-surface-900 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-surface-500 mb-6 max-w-md">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};
