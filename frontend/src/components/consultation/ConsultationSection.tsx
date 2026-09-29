import React, { useState } from 'react';
import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ConsultationSectionProps {
  id?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}

export const ConsultationSection: React.FC<ConsultationSectionProps> = ({
  id,
  title,
  description,
  icon: Icon,
  badge,
  isCollapsible = false,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  children,
  className,
  headerRight,
}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : uncontrolledIsOpen;

  const handleToggle = () => {
    if (isCollapsible) {
      if (isControlled && controlledOnToggle) {
        controlledOnToggle();
      } else {
        setUncontrolledIsOpen((prev) => !prev);
      }
    }
  };

  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-all overflow-hidden',
        className
      )}
    >
      {/* Section Header */}
      <div
        onClick={isCollapsible ? handleToggle : undefined}
        className={cn(
          'p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors',
          isCollapsible && 'cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 select-none',
          open && isCollapsible && 'border-b border-slate-100 dark:border-slate-800'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {title}
              </h2>
              {badge && (
                <div className="shrink-0">
                  {typeof badge === 'string' || typeof badge === 'number' ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {badge}
                    </span>
                  ) : (
                    badge
                  )}
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {headerRight && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          )}
          {isCollapsible && (
            <button
              type="button"
              className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
            >
              {open ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Section Content */}
      {open && (
        <div className="p-4 sm:p-6 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </section>
  );
};
