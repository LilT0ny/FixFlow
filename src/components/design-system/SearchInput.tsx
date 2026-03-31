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
    <div className={cn("relative w-full md:w-[400px] group", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 w-5 h-5 group-focus-within:text-primary-500 transition-colors" />
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3 bg-white border border-surface-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm shadow-sm placeholder:text-surface-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
