import React from 'react';
import { cn } from '../../lib/cn';

interface DataCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const DataCard: React.FC<DataCardProps> = ({
  children,
  className,
  padding = 'md',
  hover = false
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={cn(
      "bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden",
      paddingStyles[padding],
      hover && "transition-all duration-150 hover:shadow-sm hover:border-surface-300",
      className
    )}>
      {children}
    </div>
  );
};
