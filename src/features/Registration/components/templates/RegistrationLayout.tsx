import React, { type ReactNode } from 'react';

interface RegistrationLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const RegistrationLayout: React.FC<RegistrationLayoutProps> = ({ title, subtitle, children }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end px-4 sm:px-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-surface-900">{title}</h2>
          <p className="text-gray-500">{subtitle}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border border-surface-100 overflow-hidden">
          <div className="p-6 sm:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
