import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Plus, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SearchableOption {
  value: string;
  label: string;
  category?: string;
  description?: string;
}

export interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchableOption[];
  value?: string;
  onChange?: (value: string) => void;
  onAddNew?: (searchQuery: string) => void;
  addNewLabel?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Select or search...',
  options,
  value,
  onChange,
  onAddNew,
  addNewLabel = '+ Add manually',
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

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.category && opt.category.toLowerCase().includes(q)) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleSelect = (val: string) => {
    onChange?.(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
  };

  const handleAddNew = () => {
    onAddNew?.(searchQuery);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-navy-700 flex items-center gap-1 select-none">
          {label}
          {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'w-full min-h-[42px] px-3.5 py-2 text-left text-sm rounded-lg border bg-white text-navy-900 transition-colors flex items-center justify-between gap-2',
          'focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500',
          'disabled:bg-navy-50 disabled:text-navy-400 disabled:cursor-not-allowed',
          error
            ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
            : 'border-navy-200 hover:border-navy-300'
        )}
      >
        <span className={cn('truncate', !selectedOption && 'text-navy-400')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 text-navy-400">
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="p-0.5 hover:text-navy-600 rounded transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white rounded-xl border border-navy-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input */}
          <div className="p-2 border-b border-navy-100 flex items-center gap-2 bg-navy-50/50">
            <Search className="w-4 h-4 text-navy-400 shrink-0 ml-1.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search options..."
              className="w-full text-sm bg-transparent border-none outline-none text-navy-900 placeholder:text-navy-400 py-1"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 flex flex-col gap-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 px-3 text-center text-xs text-navy-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm rounded-lg flex items-center justify-between gap-2 transition-colors',
                      isSelected
                        ? 'bg-medical-50 text-medical-800 font-medium'
                        : 'text-navy-700 hover:bg-navy-50'
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="text-xs text-navy-400 truncate">{opt.description}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-medical-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Section 25 & 53: "+ Add manually" Action */}
          {onAddNew && (
            <div className="p-1.5 border-t border-navy-100 bg-navy-50/40">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full px-3 py-2 text-left text-xs font-semibold text-medical-700 hover:text-medical-800 hover:bg-medical-50/60 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{addNewLabel}</span>
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
