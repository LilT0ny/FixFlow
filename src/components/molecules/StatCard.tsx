import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  amount: number | string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  delay?: string;
  isCurrency?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  amount, 
  icon: Icon, 
  color, 
  bgColor, 
  delay,
  isCurrency = true
}) => {
  const displayValue = typeof amount === 'number' 
    ? (isCurrency ? `$${amount.toFixed(2)}` : amount.toString())
    : amount;

  return (
    <div 
      style={{ animationDelay: delay }} 
      className="bg-white rounded-[40px] border border-surface-100/50 p-8 flex items-center gap-6 shadow-xl shadow-surface-200/20 hover:shadow-primary-100/30 hover:scale-[1.02] transition-all cursor-default group border-b-8 border-b-transparent hover:border-b-primary-500 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      <div className={`${bgColor} ${color} w-20 h-20 rounded-[32px] flex items-center justify-center transition-all group-hover:rotate-12 shadow-sm border border-surface-50 shrink-0`}>
        <Icon className="w-8 h-8" />
      </div>
      <div className="overflow-hidden space-y-2">
        <p className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] leading-none mb-1 opacity-70">
          {title}
        </p>
        <h3 className="text-3xl font-black text-surface-900 tracking-tighter truncate group-hover:text-primary-600 transition-colors">
          {displayValue}
        </h3>
      </div>
    </div>
  );
};
