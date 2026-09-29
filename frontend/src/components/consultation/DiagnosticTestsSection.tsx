import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FlaskConical,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Loader2,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';
import { masterDataService } from '../../services/masterDataService';
import { useToast } from '../../hooks/useToast';
import type { DiagnosticTest } from '../../types/masterData';
import type {
  ConsultationDiagnosticTest,
  DiagnosticTestStatus,
} from '../../types/consultation';

export interface DiagnosticTestsSectionProps {
  tests: ConsultationDiagnosticTest[];
  onChange: (tests: ConsultationDiagnosticTest[]) => void;
}

const STATUS_OPTIONS: { value: DiagnosticTestStatus; label: string; badgeClass: string }[] = [
  {
    value: 'Ordered',
    label: 'Ordered',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  {
    value: 'Pending',
    label: 'Pending',
    badgeClass: 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  },
  {
    value: 'Completed',
    label: 'Completed',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  {
    value: 'Reviewed',
    label: 'Reviewed',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
];

export const DiagnosticTestsSection: React.FC<DiagnosticTestsSectionProps> = ({
  tests,
  onChange,
}) => {
  const { success, error: toastError } = useToast();

  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [masterTests, setMasterTests] = useState<DiagnosticTest[]>([]);
  const [isLoadingMaster, setIsLoadingMaster] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch diagnostic tests master data
  const fetchMasterTests = useCallback(async () => {
    setIsLoadingMaster(true);
    try {
      const response = await masterDataService.getDiagnosticTests({
        is_active: true,
        page_size: 250,
        sort_by: 'name',
        sort_order: 'asc',
      });
      setMasterTests(response.items || []);
    } catch {
      // Non-blocking error
    } finally {
      setIsLoadingMaster(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterTests();
  }, [fetchMasterTests]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter master tests based on debounced search query
  const filteredMasterTests = useMemo(() => {
    if (!debouncedQuery) {
      return masterTests.slice(0, 15);
    }
    const q = debouncedQuery.toLowerCase();
    return masterTests.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
    );
  }, [masterTests, debouncedQuery]);

  // Check if current search query already exists or is selected
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const exactMatchExists = masterTests.some(
    (t) => t.name.toLowerCase() === normalizedQuery
  );

  // Handler to select an existing master test
  const handleSelectMasterTest = (test: DiagnosticTest) => {
    const isAlreadySelected = tests.some(
      (t) => t.test_name.toLowerCase() === test.name.toLowerCase()
    );

    if (isAlreadySelected) {
      toastError(`"${test.name}" is already added to diagnostic tests.`, 'Already Selected');
      setSearchQuery('');
      setIsDropdownOpen(false);
      return;
    }

    const newTestItem: ConsultationDiagnosticTest = {
      diagnostic_test_id: test.id,
      test_name: test.name,
      category: test.category || 'General',
      status: 'Ordered',
      clinical_indication: '',
      result: '',
      result_date: null,
      doctor_notes: '',
    };

    onChange([...tests, newTestItem]);
    setSearchQuery('');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
    // Expand the newly added test details for easy clinical entry
    setExpandedIndex(tests.length);
  };

  // Handler to add and select a custom unlisted diagnostic test (Section 6)
  const handleAddCustomTest = async (customName: string) => {
    const cleanName = customName.trim();
    if (!cleanName) return;

    // Check duplicate in selected list
    if (tests.some((t) => t.test_name.toLowerCase() === cleanName.toLowerCase())) {
      toastError(`"${cleanName}" is already added.`, 'Already Added');
      setSearchQuery('');
      setIsDropdownOpen(false);
      return;
    }

    // Check duplicate in master list
    const existingMaster = masterTests.find(
      (t) => t.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existingMaster) {
      handleSelectMasterTest(existingMaster);
      return;
    }

    setIsCreatingCustom(true);
    try {
      // Auto-create in master data table
      const created = await masterDataService.createItem<DiagnosticTest>(
        'diagnostic-tests',
        {
          name: cleanName,
          category: 'General',
          is_active: true,
          sort_order: 999,
        }
      );

      // Add to local master tests state
      setMasterTests((prev) => [...prev, created]);

      // Add to selected consultation tests immediately
      const newTestItem: ConsultationDiagnosticTest = {
        diagnostic_test_id: created.id,
        test_name: created.name,
        category: created.category || 'General',
        status: 'Ordered',
        clinical_indication: '',
        result: '',
        result_date: null,
        doctor_notes: '',
      };

      onChange([...tests, newTestItem]);
      setSearchQuery('');
      setIsDropdownOpen(false);
      setExpandedIndex(tests.length);
      success(
        `Added "${cleanName}" to diagnostic tests master data and selected.`,
        'Test Added'
      );
    } catch {
      // Fallback: If server master creation failed, associate locally so data is not lost
      const fallbackItem: ConsultationDiagnosticTest = {
        test_name: cleanName,
        category: 'General',
        status: 'Ordered',
        clinical_indication: '',
        result: '',
        result_date: null,
        doctor_notes: '',
      };
      onChange([...tests, fallbackItem]);
      setSearchQuery('');
      setIsDropdownOpen(false);
      setExpandedIndex(tests.length);
    } finally {
      setIsCreatingCustom(false);
    }
  };

  // Handler to remove a test from consultation
  const handleRemoveTest = (indexToRemove: number) => {
    onChange(tests.filter((_, idx) => idx !== indexToRemove));
    if (expandedIndex === indexToRemove) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > indexToRemove) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  // Handler to update test details
  const handleUpdateTestDetail = (
    index: number,
    field: keyof ConsultationDiagnosticTest,
    value: unknown
  ) => {
    const updated = [...tests];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsDropdownOpen(true);
      }
      return;
    }

    const totalSelectable =
      filteredMasterTests.length + (!exactMatchExists && debouncedQuery ? 1 : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < totalSelectable - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : totalSelectable - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (
        highlightedIndex >= 0 &&
        highlightedIndex < filteredMasterTests.length
      ) {
        handleSelectMasterTest(filteredMasterTests[highlightedIndex]);
      } else if (
        !exactMatchExists &&
        debouncedQuery &&
        highlightedIndex === filteredMasterTests.length
      ) {
        handleAddCustomTest(debouncedQuery);
      } else if (!exactMatchExists && debouncedQuery) {
        handleAddCustomTest(debouncedQuery);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              Diagnostic Tests
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Laboratory, electrophysiology, and neuroimaging investigations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {tests.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
              {tests.length} {tests.length === 1 ? 'test' : 'tests'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsSectionOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isSectionOpen ? "Collapse Diagnostic Tests" : "Expand Diagnostic Tests"}
          >
            <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", isSectionOpen && "rotate-180")} />
          </button>
        </div>
      </CardHeader>

      {isSectionOpen && (
        <CardContent className="p-5 space-y-5 animate-in fade-in duration-150">
        {/* ─── 1. Searchable Diagnostic Test Field ─── */}
        <div ref={containerRef} className="relative">
          <label
            htmlFor="diagnostic-test-search"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Search & Order Diagnostic Tests
          </label>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </div>

            <input
              id="diagnostic-test-search"
              ref={searchInputRef}
              type="text"
              className="w-full pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              placeholder="Search diagnostic test (e.g. MRI Brain, EEG, CBC, HbA1c, CT Brain)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />

            {isLoadingMaster && (
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600 dark:text-primary-400" />
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="absolute z-30 w-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 animate-in fade-in duration-150">
              {filteredMasterTests.length > 0 ? (
                <div>
                  <div className="px-3 py-1.5 bg-slate-50/70 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Diagnostic Tests Master Data
                  </div>
                  {filteredMasterTests.map((item, idx) => {
                    const isSelected = tests.some(
                      (t) => t.test_name.toLowerCase() === item.name.toLowerCase()
                    );
                    const isHighlighted = idx === highlightedIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectMasterTest(item)}
                        disabled={isSelected}
                        className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? 'bg-slate-50/50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                            : isHighlighted
                            ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-primary-200 font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{item.name}</span>
                          {item.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0 font-medium">
                              {item.category}
                            </span>
                          )}
                        </div>

                        {isSelected && (
                          <span className="text-[11px] text-primary-700 dark:text-primary-400 font-semibold flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                            Added
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {/* No match / Add Custom Option (Section 6) */}
              {!exactMatchExists && debouncedQuery && (
                <div className="p-2 bg-gradient-to-r from-primary-50/50 via-white dark:via-slate-800 to-slate-50/40">
                  {filteredMasterTests.length === 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>No diagnostic test found matching "{debouncedQuery}".</span>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleAddCustomTest(debouncedQuery)}
                    disabled={isCreatingCustom}
                    className={`w-full mt-1 px-3 py-2 rounded-lg text-left text-xs font-semibold text-primary-700 dark:text-primary-300 bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-700 hover:bg-primary-50/80 dark:hover:bg-primary-950/40 flex items-center justify-between transition-colors shadow-2xs ${
                      highlightedIndex === filteredMasterTests.length
                        ? 'ring-2 ring-primary-500'
                        : ''
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isCreatingCustom ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-600 dark:text-primary-400" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                      )}
                      <span>+ Add "{debouncedQuery}"</span>
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      Save to master data
                    </span>
                  </button>
                </div>
              )}

              {masterTests.length === 0 && !isLoadingMaster ? (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    No diagnostic tests available.
                  </p>
                  <a
                    href="/admin/master-data?category=diagnostic_tests"
                    className="inline-flex items-center text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline px-2.5 py-1 rounded-md bg-primary-50 dark:bg-primary-950/50 border border-primary-200 dark:border-primary-800"
                  >
                    Manage Diagnostic Tests
                  </a>
                </div>
              ) : filteredMasterTests.length === 0 && !debouncedQuery ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Type to search diagnostic investigations.
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ─── 2. Selected Tests Chips / Tags (Section 7) ─── */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-bold mb-2">
            <span>Selected Tests ({tests.length})</span>
            {tests.length > 0 && (
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                Click a card below to edit clinical findings and indication
              </span>
            )}
          </div>

          {tests.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/40">
              <FlaskConical className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No diagnostic tests selected.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Search above to order laboratory, imaging, or neuro-diagnostic tests for this consultation.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Chips wrap naturally on mobile without horizontal scrolling */}
              <div className="flex flex-wrap gap-2">
                {tests.map((test, index) => {
                  const statusOpt =
                    STATUS_OPTIONS.find((s) => s.value === test.status) ||
                    STATUS_OPTIONS[0];

                  const isExpanded = expandedIndex === index;

                  return (
                    <div
                      key={`${test.test_name}-${index}`}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        isExpanded
                          ? 'bg-primary-50/80 dark:bg-primary-950/60 border-primary-300 dark:border-primary-700 text-primary-950 dark:text-primary-100 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIndex(isExpanded ? null : index)
                        }
                        className="font-semibold hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1.5 text-left"
                      >
                        <span>{test.test_name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full border font-medium ${statusOpt.badgeClass}`}
                        >
                          {test.status}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIndex(isExpanded ? null : index)
                        }
                        className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                        title={isExpanded ? 'Collapse details' : 'Edit details'}
                        aria-label="Toggle test details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveTest(index)}
                        className="text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 ml-0.5 rounded-sm hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title={`Remove ${test.test_name}`}
                        aria-label={`Remove ${test.test_name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ─── 3. Compact Expandable Test Details (Section 8 & 9) ─── */}
              {tests.map((test, index) => {
                const isExpanded = expandedIndex === index;
                if (!isExpanded) return null;

                const statusOpt =
                  STATUS_OPTIONS.find((s) => s.value === test.status) ||
                  STATUS_OPTIONS[0];

                return (
                  <div
                    key={`details-${test.test_name}-${index}`}
                    className="p-4 rounded-xl border border-primary-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-4 shadow-xs animate-in fade-in duration-150"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {test.test_name}
                        </span>
                        {test.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {test.category}
                          </span>
                        )}
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusOpt.badgeClass}`}
                        >
                          Status: {test.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedIndex(null)}
                          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1"
                        >
                          <span>Hide Details</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(index)}
                          className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium px-2 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          Remove Test
                        </button>
                      </div>
                    </div>

                    {/* Form Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Status Dropdown */}
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Test Status <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={test.status}
                          onChange={(e) =>
                            handleUpdateTestDetail(
                              index,
                              'status',
                              e.target.value as DiagnosticTestStatus
                            )
                          }
                          className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          Selection does not imply completion. Default is "Ordered".
                        </p>
                      </div>

                      {/* Result Date */}
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>Result Date</span>
                        </label>
                        <input
                          type="date"
                          value={
                            test.result_date
                              ? test.result_date.substring(0, 10)
                              : ''
                          }
                          onChange={(e) =>
                            handleUpdateTestDetail(
                              index,
                              'result_date',
                              e.target.value ? e.target.value : null
                            )
                          }
                          className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                      </div>

                      {/* Clinical Indication */}
                      <div className="md:col-span-2">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                          <Info className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>Clinical Indication (Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Evaluation of recurrent seizure episodes / R/O acute ischemic stroke"
                          value={test.clinical_indication || ''}
                          onChange={(e) =>
                            handleUpdateTestDetail(
                              index,
                              'clinical_indication',
                              e.target.value
                            )
                          }
                          maxLength={500}
                          className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>

                      {/* Result / Findings */}
                      <div className="md:col-span-2">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>Result / Findings (Optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Enter test findings (can remain empty if test is only ordered or pending)..."
                          value={test.result || ''}
                          onChange={(e) =>
                            handleUpdateTestDetail(
                              index,
                              'result',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>

                      {/* Doctor Notes */}
                      <div className="md:col-span-2">
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Doctor Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Additional clinical notes regarding this investigation..."
                          value={test.doctor_notes || ''}
                          onChange={(e) =>
                            handleUpdateTestDetail(
                              index,
                              'doctor_notes',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
      )}
    </Card>
  );
};

