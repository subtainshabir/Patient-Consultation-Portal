import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98] transition-transform duration-100';

    const variants = {
      primary:
        'bg-medical-600 text-white hover:bg-medical-700 active:bg-medical-800 focus-visible:ring-medical-500 shadow-sm',
      secondary:
        'bg-navy-100 text-navy-800 hover:bg-navy-200 active:bg-navy-300 focus-visible:ring-navy-400',
      outline:
        'border border-navy-300 bg-white text-navy-700 hover:bg-navy-50 active:bg-navy-100 focus-visible:ring-medical-500 shadow-sm',
      ghost:
        'bg-transparent text-navy-700 hover:bg-navy-100 active:bg-navy-200 focus-visible:ring-navy-400',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500 shadow-sm',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5 min-w-[32px]',
      md: 'text-sm px-4 py-2 h-10 gap-2 min-h-[40px]',
      lg: 'text-base px-5 py-2.5 h-12 gap-2.5 min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
