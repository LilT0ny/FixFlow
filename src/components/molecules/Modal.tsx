import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ancho máximo en desktop: sm≈384px, md≈448px, lg≈512px, xl≈672px */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
};

/**
 * Shell base de todos los modales de la app: bottom-sheet en móvil,
 * diálogo centrado en desktop. Nunca se sale de la pantalla — el alto
 * máximo (92dvh, no vh) y el body con scroll interno son fijos acá,
 * no responsabilidad de cada modal.
 *
 * Renderiza en un portal a document.body: así ningún transform/filter
 * de un ancestro (layout, animaciones, etc.) puede volver a desplazar
 * o cortar un modal, sin importar dónde se monte en el árbol.
 */
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, size = 'md', children }) => {
  // Bloquear el scroll de fondo mientras el modal está abierto
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-surface-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      role="presentation"
    >
      <div
        className={`bg-white w-full rounded-t-2xl sm:rounded-xl ${SIZE_CLASS[size]} max-h-[92dvh] flex flex-col shadow-lg border border-surface-200 animate-fade-in-up overflow-hidden`}
        role="dialog"
        aria-modal="true"
      >
        {/* Handle visual — solo bottom-sheet en móvil */}
        <div className="sm:hidden flex justify-center pt-2.5 shrink-0">
          <div className="w-10 h-1 rounded-full bg-surface-200" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
};

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconClassName?: string;
  onClose: () => void;
  closeDisabled?: boolean;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  title, subtitle, icon, iconClassName, onClose, closeDisabled
}) => (
  <div className="flex items-center justify-between gap-3 px-5 py-4 shrink-0 border-b border-surface-100">
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconClassName || 'bg-surface-100 text-surface-500'}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-surface-900 truncate">{title}</h3>
        {subtitle && <p className="text-xs text-surface-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
    </div>
    <button
      type="button"
      onClick={onClose}
      disabled={closeDisabled}
      className="p-2 rounded-lg text-surface-400 hover:text-surface-900 hover:bg-surface-100 transition-colors duration-150 shrink-0 disabled:opacity-50"
      title="Cerrar"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);

export const ModalBody: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('flex-1 overflow-y-auto px-5 py-5', className)}>{children}</div>
);

/**
 * Sin dirección de flex por default (a propósito): la mayoría de los modales
 * quiere botones lado a lado incluso en móvil, pero confirmaciones
 * destructivas suelen preferir apilado. Pasar `flex-col` o
 * `flex-col sm:flex-row` en className para esos casos.
 */
export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('shrink-0 px-5 py-4 border-t border-surface-100 bg-surface-50 flex gap-2.5', className)}>
    {children}
  </div>
);
