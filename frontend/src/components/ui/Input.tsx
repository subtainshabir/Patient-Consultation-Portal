import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isLoading?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      required,
      disabled,
      isLoading,
      id,
      leftElement,
      rightElement,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-navy-700 flex items-center gap-1 select-none">
            {label}
            {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-3 flex items-center pointer-events-none text-navy-400">
              {leftElement}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            disabled={disabled || isLoading}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              'w-full min-h-[42px] px-3.5 py-2 text-sm rounded-lg border bg-white text-navy-900 transition-colors',
              'placeholder:text-navy-400',
              'focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-medical-500',
              'disabled:bg-navy-50 disabled:text-navy-400 disabled:cursor-not-allowed',
              leftElement ? 'pl-10' : '',
              rightElement || isLoading ? 'pr-10' : '',
              error
                ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500 text-rose-900'
                : 'border-navy-200 hover:border-navy-300',
              className
            )}
            {...props}
          />
          {isLoading && (
            <div className="absolute right-3 flex items-center pointer-events-none text-navy-400">
              <Loader2 className="w-4 h-4 animate-spin text-medical-600" />
            </div>
          )}
          {!isLoading && rightElement && (
            <div className="absolute right-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600 mt-0.5" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-navy-500 mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
