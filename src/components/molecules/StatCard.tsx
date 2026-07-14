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
      className="bg-white rounded-xl border border-surface-200 p-5 flex items-center gap-4 shadow-xs hover:border-surface-300 hover:shadow-sm transition-all duration-150 cursor-default animate-fade-in-up dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
    >
      <div className={`${bgColor} ${color} w-11 h-11 rounded-lg flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-surface-500 truncate dark:text-gray-400">
          {title}
        </p>
        <h3 className="text-xl md:text-2xl font-semibold text-surface-900 tracking-tight truncate mt-0.5 dark:text-gray-100">
          {displayValue}
        </h3>
      </div>
    </div>
  );
};
