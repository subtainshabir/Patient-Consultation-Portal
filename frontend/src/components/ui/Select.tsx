import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      options,
      placeholder = 'Select an option',
      error,
      helperText,
      required,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 select-none"
          >
            {label}
            {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            className={cn(
              'w-full min-h-[42px] px-3.5 py-2 pr-10 text-sm rounded-lg border transition-colors appearance-none cursor-pointer',
              'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
              'focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500 dark:focus:ring-medical-500 dark:focus:border-medical-500',
              'disabled:bg-slate-50 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed',
              error
                ? 'border-rose-400 dark:border-rose-500 focus:ring-rose-500 focus:border-rose-500 text-rose-900 dark:text-rose-200'
                : 'border-slate-300/80 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-slate-400 dark:text-slate-500">
                {placeholder}
              </option>
            )}
            {options.length === 0 && (
              <option value="" disabled className="text-slate-400 dark:text-slate-500">
                No options available
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="dark:bg-slate-900 dark:text-slate-100">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-0.5" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${selectId}-helper`} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
