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
      "col-span-full border-2 border-dashed border-surface-200 rounded-[32px] py-16 px-8 text-center flex flex-col justify-center items-center bg-surface-50/30 animate-zoom-in",
      className
    )}>
      <div className="w-20 h-20 bg-surface-100 text-surface-400 rounded-2xl flex items-center justify-center mb-6">
        {icon || <Search className="w-10 h-10 opacity-40" />}
      </div>
      <h3 className="text-xl font-black text-surface-900 tracking-tight mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-xs font-black text-surface-400 uppercase tracking-widest mb-6 max-w-md">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};
