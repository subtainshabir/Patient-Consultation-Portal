import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'md',
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on ESC key press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
    '3xl': 'max-w-4xl',
    '4xl': 'max-w-5xl',
    '5xl': 'max-w-6xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content Container */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full bg-white rounded-2xl border border-navy-200 shadow-2xl z-10 overflow-hidden transform transition-all duration-200 animate-in zoom-in-95',
          maxWidths[maxWidth],
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}> = ({ title, description, onClose, className }) => {
  return (
    <div className={cn('p-5 sm:p-6 pb-4 border-b border-navy-100 flex items-start justify-between gap-4', className)}>
      <div>
        <h2 className="text-lg font-bold text-navy-950 tracking-tight">{title}</h2>
        {description && <p className="text-xs sm:text-sm text-navy-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="text-navy-400 hover:text-navy-700 hover:bg-navy-100 p-1.5 rounded-lg transition-colors -mr-1 -mt-1"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export const DialogContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
};

export const DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'p-4 sm:p-5 border-t border-navy-100 bg-navy-50/50 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
