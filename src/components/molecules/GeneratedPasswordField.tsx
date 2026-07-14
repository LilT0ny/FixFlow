import { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

interface Props {
  password: string;
  onRegenerate?: () => void;
  label?: string;
}

/** Muestra una contraseña generada, lista para copiar — no se tipea a mano. */
export const GeneratedPasswordField = ({ password, onRegenerate, label = 'Contraseña temporal (generada)' }: Props) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-surface-600 dark:text-gray-400">{label}</label>
      <div className="flex gap-2">
        <code className="flex-1 min-w-0 px-3.5 py-2.5 bg-surface-50 border border-surface-300 rounded-lg text-sm font-mono text-surface-900 select-all truncate dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
          {password}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          title="Copiar"
          className="px-3 border border-surface-300 rounded-lg hover:bg-surface-50 transition-colors duration-150 shrink-0 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          {copied ? <Check className="w-4 h-4 text-success-600" /> : <Copy className="w-4 h-4 text-surface-600 dark:text-gray-400" />}
        </button>
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            title="Generar otra"
            className="px-3 border border-surface-300 rounded-lg hover:bg-surface-50 transition-colors duration-150 shrink-0 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-4 h-4 text-surface-600 dark:text-gray-400" />
          </button>
        )}
      </div>
      <p className="text-[11px] text-surface-400 dark:text-gray-500">Copiala y compartila con la persona. Va a tener que cambiarla en su primer ingreso.</p>
    </div>
  );
};
