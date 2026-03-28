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
      className="bg-white rounded-[32px] md:rounded-[40px] border border-surface-100/50 p-5 md:p-6 lg:p-7 flex items-center gap-4 md:gap-5 shadow-xl shadow-surface-200/20 hover:shadow-primary-100/30 hover:scale-[1.02] transition-all cursor-default group border-b-8 border-b-transparent hover:border-b-primary-500 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700"
    >
      <div className={`${bgColor} ${color} w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-[18px] md:rounded-[24px] flex items-center justify-center transition-all group-hover:rotate-12 shadow-sm border border-surface-50 shrink-0`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] md:text-[10px] font-black text-surface-400 uppercase tracking-widest leading-none mb-1 opacity-70 truncate">
          {title}
        </p>
        <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-surface-900 tracking-tighter truncate group-hover:text-primary-600 transition-colors">
          {displayValue}
        </h3>
      </div>
    </div>
  );
};
