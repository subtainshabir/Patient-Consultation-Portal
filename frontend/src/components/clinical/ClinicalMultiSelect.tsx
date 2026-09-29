import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, ChevronDown, Check, Plus, X, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { masterDataService } from '../../services/masterDataService';
import { AddMasterOptionModal } from './AddMasterOptionModal';
import type { MasterDataCategoryKey, MasterDataItem } from '../../types/masterData';

export interface ClinicalMultiSelectOption {
  id: number;
  value: string;
  label: string;
  subLabel?: string;
  category?: string;
  rawItem?: MasterDataItem;
}

export interface ClinicalMultiSelectProps {
  categoryKey: MasterDataCategoryKey;
  label?: string;
  placeholder?: string;
  values: string[];
  onChange: (values: string[], selectedItems?: MasterDataItem[]) => void;
  categoryFilter?: string;
  allowAddNew?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

export const ClinicalMultiSelect: React.FC<ClinicalMultiSelectProps> = ({
  categoryKey,
  label,
  placeholder = 'Search & select clinical items...',
  values = [],
  onChange,
  categoryFilter,
  allowAddNew = true,
  disabled = false,
  required = false,
  error,
  helperText,
  className,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOptionInitialName, setNewOptionInitialName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch active items on mount or when category changes
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await masterDataService.getItems<MasterDataItem>(categoryKey, {
        is_active: true,
        category: categoryFilter,
        page_size: 250,
      });
      setItems(response.items || []);
    } catch {
      setLoadError('Failed to load clinical options');
    } finally {
      setIsLoading(false);
    }
  }, [categoryKey, categoryFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Options mapping
  const options = useMemo<ClinicalMultiSelectOption[]>(() => {
    return items.map((item) => {
      let subLabel: string | undefined;
      const anyItem = item as unknown as Record<string, unknown>;

      if (categoryKey === 'medicines') {
        const parts: string[] = [];
        if (anyItem.strength) parts.push(String(anyItem.strength));
        if (anyItem.form) parts.push(String(anyItem.form));
        subLabel = parts.join(' • ');
      } else if (anyItem.urdu_label) {
        subLabel = String(anyItem.urdu_label);
      } else if (anyItem.category) {
        subLabel = String(anyItem.category);
      }

      return {
        id: item.id,
        value: item.name,
        label: item.name,
        subLabel,
        category: anyItem.category as string | undefined,
        rawItem: item,
      };
    });
  }, [items, categoryKey]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on user typing
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.subLabel?.toLowerCase().includes(q);
      const matchCat = opt.category?.toLowerCase().includes(q);
      return matchLabel || matchSub || matchCat;
    });
  }, [options, searchQuery]);

  const exactMatchExists = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return options.some((opt) => opt.label.toLowerCase() === q);
  }, [options, searchQuery]);

  const toggleOption = (val: string) => {
    let nextValues: string[];
    if (values.includes(val)) {
      nextValues = values.filter((v) => v !== val);
    } else {
      nextValues = [...values, val];
    }
    const selectedObjs = items.filter((it) => nextValues.includes(it.name));
    onChange(nextValues, selectedObjs);
  };

  const removeChip = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextValues = values.filter((v) => v !== val);
    const selectedObjs = items.filter((it) => nextValues.includes(it.name));
    onChange(nextValues, selectedObjs);
  };

  const handleOpenAddModal = (nameToAdd: string) => {
    setNewOptionInitialName(nameToAdd);
    setIsAddModalOpen(true);
    setIsOpen(false);
  };

  const handleItemCreated = (newItem: MasterDataItem) => {
    setItems((prev) => [newItem, ...prev]);
    const nextValues = Array.from(new Set([...values, newItem.name]));
    const selectedObjs = [newItem, ...items.filter((it) => values.includes(it.name))];
    onChange(nextValues, selectedObjs);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-navy-700 flex items-center justify-between"
        >
          <span className="flex items-center gap-1">
            {label}
            {required && <span className="text-rose-500 font-bold">*</span>}
          </span>
          {isLoading && (
            <span className="flex items-center gap-1 text-[11px] font-normal text-navy-400 lowercase">
              <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
              loading options...
            </span>
          )}
        </label>
      )}

      {/* Selected Chips container & trigger button */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'w-full min-h-[46px] p-2 bg-white dark:bg-slate-900 border rounded-xl flex flex-wrap items-center gap-1.5 cursor-pointer transition-all duration-150 select-none shadow-2xs',
          isOpen
            ? 'border-primary-500 ring-2 ring-primary-500/20 dark:ring-primary-400/20'
            : error
            ? 'border-rose-400 bg-rose-50/20 dark:border-rose-600 dark:bg-rose-950/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
        )}
      >
        {values.length === 0 ? (
          <span className="text-sm text-slate-400 dark:text-slate-500 px-1">{placeholder}</span>
        ) : (
          values.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800/70 text-primary-800 dark:text-primary-300 rounded-lg text-xs font-semibold animate-in fade-in duration-150"
            >
              <span className="truncate max-w-[200px]">{val}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => removeChip(val, e)}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/60 p-0.5 transition-colors"
                  title={`Remove ${val}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))
        )}

        <div className="ml-auto flex items-center gap-1.5 pl-2 text-slate-400 dark:text-slate-500 shrink-0">
          {values.length > 0 && (
            <span className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">
              {values.length}
            </span>
          )}
          <ChevronDown
            className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')}
          />
        </div>
      </div>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search box input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items or enter new..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options list */}
          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-50 dark:divide-slate-800/50 text-sm"
          >
            {isLoading && options.length === 0 ? (
              <li className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400" />
                Loading options...
              </li>
            ) : loadError ? (
              <li className="p-4 text-center text-xs text-rose-500 flex flex-col items-center gap-1">
                <span>{loadError}</span>
                <button
                  type="button"
                  onClick={() => fetchItems()}
                  className="text-xs text-primary-600 dark:text-primary-400 underline font-medium hover:text-primary-700"
                >
                  Retry
                </button>
              </li>
            ) : filteredOptions.length === 0 ? (
              <li className="py-4 px-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No matching items found.</p>
                {searchQuery.trim() && allowAddNew && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    You can add this as a new clinical master option below.
                  </p>
                )}
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = values.includes(opt.value);

                return (
                  <li
                    key={opt.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      'px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors',
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-950 dark:text-primary-100 font-medium'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{opt.subLabel}</span>
                      )}
                    </div>

                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                        isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-slate-300 dark:border-slate-600'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </li>
                );
              })
            )}

            {/* Quick add custom option */}
            {allowAddNew && searchQuery.trim() && !exactMatchExists && (
              <li className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(searchQuery.trim())}
                  className="w-full px-3 py-2.5 rounded-lg bg-primary-50/70 dark:bg-primary-950/40 hover:bg-primary-100/70 dark:hover:bg-primary-900/50 text-primary-800 dark:text-primary-300 text-left font-medium text-xs flex items-center gap-2 transition-colors group"
                >
                  <Plus className="w-4 h-4 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">
                    + Add <span className="font-bold underline">"{searchQuery.trim()}"</span> to master catalog
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 ml-auto shrink-0" />
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Helper text or error */}
      {(error || helperText) && (
        <span className={cn('text-xs', error ? 'text-rose-500 font-medium' : 'text-slate-400 dark:text-slate-500')}>
          {error || helperText}
        </span>
      )}

      {/* Dynamic Creation Modal */}
      <AddMasterOptionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categoryKey={categoryKey}
        initialName={newOptionInitialName}
        onItemCreated={handleItemCreated}
      />
    </div>
  );
};
