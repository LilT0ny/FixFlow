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
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6", className)}>
      <div className="space-y-1">
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-surface-900 leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs md:text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] opacity-80 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex gap-3">{children}</div>}
    </div>
  );
};
