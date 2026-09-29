import React from 'react';
import {
  Activity,
  AlertTriangle,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Pill,
  FileText,
  CalendarCheck,
  Check,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ConsultationNavSection {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const CONSULTATION_SECTIONS: ConsultationNavSection[] = [
  { id: 'section-vitals', label: 'Vital Signs', shortLabel: 'Vitals', icon: Activity },
  { id: 'section-symptoms', label: 'Symptoms', icon: ClipboardList },
  { id: 'section-fall-risk', label: 'Fall Risk', icon: AlertTriangle },
  { id: 'section-neuro', label: 'Neurological Exam', shortLabel: 'Neuro', icon: Stethoscope },
  { id: 'section-additional-exam', label: 'Additional Exam', shortLabel: 'Add. Exam', icon: Stethoscope },
  { id: 'section-tests', label: 'Diagnostic Tests', shortLabel: 'Tests', icon: FlaskConical },
  { id: 'section-prescription', label: 'Prescription', shortLabel: 'Rx', icon: Pill },
  { id: 'section-assessment', label: 'Clinical Notes', shortLabel: 'Notes', icon: FileText },
  { id: 'section-followup', label: 'Follow-Up', shortLabel: 'Review', icon: CalendarCheck },
];

export interface ConsultationNavProps {
  completedMap: Record<string, boolean>;
  onSectionClick?: (sectionId: string) => void;
  className?: string;
}

export const ConsultationNav: React.FC<ConsultationNavProps> = ({
  completedMap,
  onSectionClick,
  className,
}) => {
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (onSectionClick) {
      onSectionClick(id);
    }
  };

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const totalCount = CONSULTATION_SECTIONS.length;

  return (
    <div
      className={cn(
        'sticky top-16 z-15 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/90 dark:border-slate-800 shadow-2xs py-2 px-3 sm:px-6 transition-colors',
        className
      )}
      aria-label="Consultation Form Sections Navigation"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Progress summary for doctor */}
        <div className="hidden xl:flex items-center gap-2 shrink-0 pr-3 border-r border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Progress
          </span>
          <span className="font-mono text-xs font-bold text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800">
            {completedCount}/{totalCount}
          </span>
        </div>

        {/* Scrollable Navigation Strip */}
        <div className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
          {CONSULTATION_SECTIONS.map((section) => {
            const isCompleted = Boolean(completedMap[section.id]);
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleScroll(section.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer',
                  'border hover:shadow-2xs active:scale-95',
                  isCompleted
                    ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700/80 hover:border-primary-400'
                    : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                )}
                title={`Jump to ${section.label} (${isCompleted ? 'Has data' : 'Empty'})`}
              >
                {/* Completion Indicator (Section 8) */}
                <span
                  className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors',
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                  )}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : '○'}
                </span>

                <Icon className={cn('w-3.5 h-3.5 shrink-0 hidden sm:inline', isCompleted ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400')} />

                <span className="whitespace-nowrap sm:inline hidden">{section.label}</span>
                <span className="whitespace-nowrap sm:hidden inline">{section.shortLabel || section.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
