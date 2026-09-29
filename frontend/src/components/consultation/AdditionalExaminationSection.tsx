import React, { useState } from 'react';
import { Eye, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';

export interface AdditionalExaminationSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export const AdditionalExaminationSection: React.FC<AdditionalExaminationSectionProps> = ({
  value,
  onChange,
}) => {
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  return (
    <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <CardHeader className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Additional Examination</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">General physical and systemic findings outside the structured neurological exam</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {value && value.trim() && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
              Documented
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsSectionOpen((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={isSectionOpen ? "Collapse Additional Examination" : "Expand Additional Examination"}
          >
            <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", isSectionOpen && "rotate-180")} />
          </button>
        </div>
      </CardHeader>

      {isSectionOpen && (
        <CardContent className="p-5 space-y-2 animate-in fade-in duration-150">
          <label htmlFor="additional-examination-text" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
            General Physical & Systemic Examination Findings
          </label>
          <textarea
            id="additional-examination-text"
            rows={4}
            placeholder="Enter additional examination findings (e.g. general appearance, cardiovascular, respiratory, abdominal, or dermatological signs)..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Non-neurological systemic examination notes</span>
            <span>{value ? `${value.length} characters` : 'Optional'}</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
