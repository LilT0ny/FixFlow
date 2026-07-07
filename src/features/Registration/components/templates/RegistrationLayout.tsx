import React, { type ReactNode } from 'react';

interface RegistrationLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const RegistrationLayout: React.FC<RegistrationLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end pb-2 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-surface-900">{title}</h1>
          <p className="mt-1 text-sm text-surface-500">{subtitle}</p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full">
        <div className="bg-white rounded-xl border border-surface-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
