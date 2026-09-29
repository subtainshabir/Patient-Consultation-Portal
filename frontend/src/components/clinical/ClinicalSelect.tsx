import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, ChevronDown, Check, Plus, X, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { masterDataService } from '../../services/masterDataService';
import { AddMasterOptionModal } from './AddMasterOptionModal';
import type { MasterDataCategoryKey, MasterDataItem } from '../../types/masterData';

export interface ClinicalSelectOption {
  id: number;
  value: string;
  label: string;
  subLabel?: string;
  category?: string;
  description?: string;
  rawItem?: MasterDataItem;
}

export interface ClinicalSelectProps {
  categoryKey: MasterDataCategoryKey;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string, selectedItem?: MasterDataItem) => void;
  categoryFilter?: string;
  itemNameFilter?: string;
  allowAddNew?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  id?: string;
}

export const ClinicalSelect: React.FC<ClinicalSelectProps> = ({
  categoryKey,
  label,
  placeholder,
  value,
  onChange,
  categoryFilter,
  itemNameFilter,
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
  const listRef = useRef<HTMLUListElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Fetch active items on mount or when category/filter changes
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await masterDataService.getItems<MasterDataItem>(categoryKey, {
        is_active: true,
        category: categoryFilter,
        item_name: itemNameFilter,
        page_size: 250,
      });
      setItems(response.items || []);
    } catch {
      setLoadError('Failed to load clinical options');
    } finally {
      setIsLoading(false);
    }
  }, [categoryKey, categoryFilter, itemNameFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Transform items into select options with formatted labels and deduplicate by value
  const options = useMemo<ClinicalSelectOption[]>(() => {
    const seen = new Set<string>();
    const list: ClinicalSelectOption[] = [];

    for (const item of items) {
      const anyItem = item as unknown as Record<string, unknown>;
      const dedupKey =
        categoryKey === 'medicines'
          ? `${item.name}|${anyItem.strength || ''}|${anyItem.form || ''}`.toLowerCase()
          : item.name.trim().toLowerCase();

      if (seen.has(dedupKey)) {
        continue;
      }
      seen.add(dedupKey);

      let subLabel: string | undefined;
      if (categoryKey === 'medicines') {
        const parts: string[] = [];
        if (anyItem.strength) parts.push(String(anyItem.strength));
        if (anyItem.form) parts.push(String(anyItem.form));
        if (anyItem.generic_name) parts.push(`(${anyItem.generic_name})`);
        subLabel = parts.join(' • ');
      } else if (anyItem.urdu_label) {
        subLabel = String(anyItem.urdu_label);
      } else if (anyItem.roman_urdu) {
        subLabel = String(anyItem.roman_urdu);
      } else if (anyItem.category && anyItem.category !== anyItem.name) {
        subLabel = String(anyItem.category);
      }

      list.push({
        id: item.id,
        value: item.name,
        label: item.name,
        subLabel,
        category: anyItem.category as string | undefined,
        description: item.description || undefined,
        rawItem: item,
      });
    }

    return list;
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

  // Reset highlight & focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
      setHighlightedIndex(-1);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter options based on user typing
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.subLabel?.toLowerCase().includes(q);
      const matchCat = opt.category?.toLowerCase().includes(q);
      const matchDesc = opt.description?.toLowerCase().includes(q);
      return matchLabel || matchSub || matchCat || matchDesc;
    });
  }, [options, searchQuery]);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value.toLowerCase() === (value || '').toLowerCase()),
    [options, value]
  );

  const exactMatchExists = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return options.some((opt) => opt.label.toLowerCase() === q);
  }, [options, searchQuery]);

  const handleSelect = (opt: ClinicalSelectOption) => {
    onChange?.(opt.value, opt.rawItem);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('', undefined);
  };

  const handleOpenAddModal = (nameToAdd: string) => {
    setNewOptionInitialName(nameToAdd);
    setIsAddModalOpen(true);
    setIsOpen(false);
  };

  const handleItemCreated = (newItem: MasterDataItem) => {
    setItems((prev) => [newItem, ...prev]);
    onChange?.(newItem.name, newItem);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (!exactMatchExists && searchQuery.trim() && allowAddNew) {
        handleOpenAddModal(searchQuery.trim());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full flex flex-col gap-1.5', className)}
      onKeyDown={handleKeyDown}
    >
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

      {/* Main trigger button */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={cn(
          'w-full min-h-[42px] px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 select-none shadow-2xs',
          isOpen
            ? 'border-primary-500 ring-2 ring-primary-500/20 dark:ring-primary-400/20'
            : error
            ? 'border-rose-400 bg-rose-50/20 dark:border-rose-600 dark:bg-rose-950/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
        )}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {selectedOption.label}
              </span>
              {selectedOption.subLabel && (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate">
                  {selectedOption.subLabel}
                </span>
              )}
            </div>
          ) : value ? (
            // In case a custom/historical value is set that is not in active options
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{value}</span>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500 truncate">
              {placeholder || 'Select option...'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder={`Search or enter new...`}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Options list */}
          <ul
            ref={listRef}
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
            ) : options.length === 0 ? (
              <li className="py-4 px-3 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No {categoryKey.replace(/_/g, ' ')} available.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={`/admin/master-data?category=${categoryKey}`}
                    className="inline-flex items-center text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline px-2.5 py-1 rounded-md bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800"
                  >
                    Manage {categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1).replace(/_/g, ' ')}
                  </a>
                </div>
              </li>
            ) : filteredOptions.length === 0 ? (
              <li className="py-4 px-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No matching clinical options found.</p>
                {searchQuery.trim() && allowAddNew && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    You can add this as a new custom master item below.
                  </p>
                )}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = selectedOption?.value === opt.value;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={opt.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors',
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-900 dark:text-primary-200 font-semibold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 truncate">{opt.subLabel}</span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />}
                  </li>
                );
              })
            )}

            {/* Quick add custom option item */}
            {allowAddNew && searchQuery.trim() && !exactMatchExists && (
              <li className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(searchQuery.trim())}
                  className="w-full px-3 py-2.5 rounded-lg bg-primary-50/70 dark:bg-primary-950/40 hover:bg-primary-100/70 dark:hover:bg-primary-900/50 text-primary-800 dark:text-primary-300 text-left font-medium text-xs flex items-center gap-2 transition-colors group"
                >
                  <Plus className="w-4 h-4 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">
                    + Add <span className="font-bold underline">"{searchQuery.trim()}"</span> to master list
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
