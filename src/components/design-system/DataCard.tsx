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
      "bg-white rounded-[32px] border border-surface-100/50 shadow-sm overflow-hidden",
      paddingStyles[padding],
      hover && "transition-all hover:shadow-md hover:border-surface-200",
      className
    )}>
      {children}
    </div>
  );
};
