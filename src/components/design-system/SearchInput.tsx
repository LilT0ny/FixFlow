import React from 'react';
import { cn } from '../../lib/cn';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounce?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Buscar...",
  className
}) => {
  return (
    <div className={cn("relative w-full md:w-[360px] group", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4 group-focus-within:text-primary-600 transition-colors duration-150" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-white border border-surface-300 rounded-lg text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors duration-150 hover:border-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-surface-400 hover:text-surface-600 transition-colors duration-150 animate-fade-in"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
