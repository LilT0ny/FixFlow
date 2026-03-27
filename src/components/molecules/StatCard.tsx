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
      className="bg-white rounded-[32px] md:rounded-[40px] border border-surface-100/50 p-6 md:p-8 flex items-center gap-4 md:gap-6 shadow-xl shadow-surface-200/20 hover:shadow-primary-100/30 hover:scale-[1.02] transition-all cursor-default group border-b-8 border-b-transparent hover:border-b-primary-500 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      <div className={`${bgColor} ${color} w-14 h-14 md:w-20 md:h-20 rounded-[24px] md:rounded-[32px] flex items-center justify-center transition-all group-hover:rotate-12 shadow-sm border border-surface-50 shrink-0`}>
        <Icon className="w-6 h-6 md:w-8 md:h-8" />
      </div>
      <div className="overflow-hidden space-y-1 md:space-y-2">
        <p className="text-[10px] md:text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] leading-tight mb-1 opacity-70">
          {title}
        </p>
        <h3 className="text-2xl md:text-3xl font-black text-surface-900 tracking-tighter truncate group-hover:text-primary-600 transition-colors">
          {displayValue}
        </h3>
      </div>
    </div>
  );
};
