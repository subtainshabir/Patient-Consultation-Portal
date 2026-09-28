import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface MultiSelectOption {
  value: string;
  label: string;
  category?: string;
}

export interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  options: MultiSelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  onAddNew?: (searchQuery: string) => void;
  addNewLabel?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  placeholder = 'Search & select items...',
  options,
  values,
  onChange,
  onAddNew,
  addNewLabel = '+ Add custom item',
  error,
  helperText,
  disabled,
  required,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.category && opt.category.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const selectedLabelsMap = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((opt) => map.set(opt.value, opt.label));
    return map;
  }, [options]);

  const toggleOption = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val));
    } else {
      onChange([...values, val]);
    }
  };

  const removeChip = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter((v) => v !== val));
  };

  const handleAddNew = () => {
    onAddNew?.(searchQuery);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={cn('relative w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-navy-700 flex items-center gap-1 select-none">
          {label}
          {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
        </label>
      )}

      {/* Selected Chips container & trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => e.key === 'Enter' && !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'w-full min-h-[46px] p-2 text-sm rounded-lg border bg-white text-navy-900 transition-colors flex items-center justify-between gap-2 cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500',
          'disabled:bg-navy-50 disabled:text-navy-400 disabled:cursor-not-allowed',
          error
            ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500'
            : 'border-navy-200 hover:border-navy-300'
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {values.length === 0 ? (
            <span className="text-navy-400 text-sm px-1.5">{placeholder}</span>
          ) : (
            values.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-medical-50 text-medical-800 border border-medical-200 shrink-0 select-none animate-in fade-in"
              >
                <span>{selectedLabelsMap.get(val) || val}</span>
                <button
                  type="button"
                  onClick={(e) => removeChip(val, e)}
                  aria-label={`Remove ${selectedLabelsMap.get(val) || val}`}
                  className="p-0.5 rounded hover:bg-medical-200 text-medical-600 hover:text-medical-900 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <div className="shrink-0 text-navy-400 pr-1">
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')} />
        </div>
      </div>

      {/* Dropdown search and options */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl border border-navy-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-navy-100 flex items-center gap-2 bg-navy-50/50">
            <Search className="w-4 h-4 text-navy-400 shrink-0 ml-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or filter..."
              className="w-full text-sm bg-transparent border-none outline-none text-navy-900 placeholder:text-navy-400 py-1"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-navy-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm rounded-lg flex items-center justify-between gap-2 transition-colors',
                      isSelected
                        ? 'bg-medical-50 text-medical-900 font-medium'
                        : 'text-navy-700 hover:bg-navy-50'
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.category && (
                        <span className="text-xs text-navy-400">{opt.category}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-medical-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {onAddNew && searchQuery.trim() && (
            <div className="p-1.5 border-t border-navy-100 bg-navy-50/40">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-medical-700 hover:text-medical-800 hover:bg-medical-50/60 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {addNewLabel}: "{searchQuery}"
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600 mt-0.5" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-navy-500 mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
};
