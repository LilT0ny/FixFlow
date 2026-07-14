import React from 'react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  children,
  className
}) => {
  return (
    <div className={cn("flex flex-col gap-4 pb-8 md:flex-row md:items-center md:justify-between animate-fade-in-up", className)}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-surface-900 dark:text-gray-100">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-surface-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
};
