import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-success-50 border-success-100 text-success-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400',
  error: 'bg-danger-50 border-danger-100 text-danger-700 dark:bg-red-950 dark:border-red-900 dark:text-red-400',
  warning: 'bg-warning-50 border-warning-100 text-warning-700 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-400',
  info: 'bg-primary-50 border-primary-100 text-primary-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400',
};

const ICON_COLOR: Record<ToastType, string> = {
  success: 'text-success-500 dark:text-emerald-400',
  error: 'text-danger-500 dark:text-red-400',
  warning: 'text-warning-500 dark:text-amber-400',
  info: 'text-primary-500 dark:text-blue-400',
};

const DURATION_MS = 4000;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => dismiss(id), DURATION_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-4 right-4 z-[300] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm pointer-events-none">
          {toasts.map(t => {
            const Icon = ICONS[t.type];
            return (
              <div
                key={t.id}
                role="status"
                className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border shadow-lg animate-fade-in-up ${STYLES[t.type]}`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${ICON_COLOR[t.type]}`} />
                <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
