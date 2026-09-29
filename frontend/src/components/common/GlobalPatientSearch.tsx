import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, User, UserPlus, ArrowRight } from 'lucide-react';
import { patientService } from '../../services/patientService';
import type { Patient } from '../../types/patient';
import { cn } from '../../utils/cn';

interface GlobalPatientSearchProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export const GlobalPatientSearch: React.FC<GlobalPatientSearchProps> = ({
  className,
  placeholder = 'Search patient by ID, Name, Mobile, CNIC... (Ctrl+K)',
  autoFocus = false,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut (Ctrl+K or ⌘K or '/')
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await patientService.getPatients({
          search: trimmed,
          page: 1,
          page_size: 6,
          is_active: null, // search all patients
        });
        setResults(response.items || []);
      } catch (err) {
        console.error('Failed to search patients:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectPatient = useCallback(
    (patientId: string) => {
      setIsOpen(false);
      setQuery('');
      navigate(`/patients/${patientId}`);
    },
    [navigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelectPatient(results[highlightedIndex].patient_id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full max-w-lg', className)}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full pl-9 pr-16 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all',
            'bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800',
            'border border-slate-200/90 dark:border-slate-700/80 focus:border-primary-500 dark:focus:border-primary-500',
            'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:focus:ring-primary-500/30'
          )}
          aria-label="Search patients"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />

        {/* Clear or Shortcut Badge */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Floating Results Popover */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {isLoading && results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600 dark:text-primary-400" />
              <span>Searching patient records...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  No patients found for "{query}"
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Try searching by Patient ID (DRN-XXXXXX), Name, or Mobile Number.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/patients/new');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register New Patient</span>
              </button>
            </div>
          ) : (
            <div>
              <div className="p-2.5 bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span>Matching Patients ({results.length})</span>
                <span className="text-[10px]">Press Enter to open</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto">
                {results.map((patient, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <div
                      key={patient.patient_id}
                      onClick={() => handleSelectPatient(patient.patient_id)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        'p-3 sm:px-4 cursor-pointer flex items-center justify-between gap-3 transition-colors',
                        isHighlighted
                          ? 'bg-primary-50/70 dark:bg-primary-950/40 text-primary-950 dark:text-primary-50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-900 dark:text-slate-100'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-950/80 text-primary-800 dark:text-primary-300 border border-primary-200/80 dark:border-primary-800/60 shrink-0">
                            {patient.patient_id}
                          </span>
                          <p className="text-xs sm:text-sm font-bold truncate">
                            {patient.full_name}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <span>{patient.age} yrs</span>
                          <span>•</span>
                          <span>{patient.gender}</span>
                          <span>•</span>
                          <span className="font-mono">📱 {patient.mobile_number}</span>
                          {patient.cnic && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px]">CNIC: {patient.cnic}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPatient(patient.patient_id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-600 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-3">
                <span>Looking for someone else?</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/patients?q=${encodeURIComponent(query)}`);
                  }}
                  className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  View all in Directory →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
