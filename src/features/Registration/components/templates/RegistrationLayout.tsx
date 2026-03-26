import React, { type ReactNode } from 'react';

interface RegistrationLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const RegistrationLayout: React.FC<RegistrationLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end px-4 sm:px-0 pb-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tight text-surface-900">{title}</h2>
          <p className="text-[11px] font-black text-surface-400 uppercase tracking-[0.2em] opacity-80">{subtitle}</p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border border-surface-100 overflow-hidden">
          <div className="p-6 sm:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
