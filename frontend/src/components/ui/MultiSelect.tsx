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
        <label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 select-none">
          {label}
          {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
        </label>
      )}

      {/* Selected Chips container & trigger */}
      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'w-full min-h-[42px] p-1.5 px-3 rounded-lg border transition-colors flex items-center justify-between gap-2 cursor-pointer',
          'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
          'focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 dark:focus:ring-medical-500 dark:focus:border-medical-500',
          'disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed',
          error
            ? 'border-rose-400 dark:border-rose-500 text-rose-900 dark:text-rose-200'
            : 'border-slate-300/80 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          {values.length === 0 ? (
            <span className="text-sm text-slate-400 dark:text-slate-500 select-none px-1">
              {placeholder}
            </span>
          ) : (
            values.map((val) => {
              const labelText = selectedLabelsMap.get(val) || val;
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-medical-50 dark:bg-medical-950/70 text-medical-800 dark:text-medical-200 border border-medical-200/80 dark:border-medical-800/80 shrink-0"
                >
                  <span className="max-w-[180px] truncate">{labelText}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeChip(val, e)}
                      className="p-0.5 hover:text-medical-950 dark:hover:text-white rounded-full transition-colors"
                      title={`Remove ${labelText}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              );
            })
          )}
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/60 dark:bg-slate-850">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 ml-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter items..."
              className="w-full text-sm bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 py-1"
            />
          </div>

          {/* Items list with checkboxes */}
          <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching items found
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
                        ? 'bg-medical-50/70 dark:bg-medical-950/60 text-medical-800 dark:text-medical-200 font-medium'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.category && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{opt.category}</span>
                      )}
                    </div>
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-medical-600 dark:bg-medical-500 border-medical-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Add custom item */}
          {onAddNew && (
            <div className="p-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-medical-700 dark:text-medical-300 hover:bg-medical-50/60 dark:hover:bg-medical-950/50 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addNewLabel}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-0.5" role="alert">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {helperText}
        </p>
      )}
    </div>
  );
};
