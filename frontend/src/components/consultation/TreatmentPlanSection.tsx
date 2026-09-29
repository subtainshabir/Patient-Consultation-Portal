import React from 'react';
import { HeartHandshake, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface TreatmentPlanSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export const TreatmentPlanSection: React.FC<TreatmentPlanSectionProps> = ({
  value,
  onChange,
}) => {
  return (
    <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <CardHeader className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Treatment Plan</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Therapeutic strategy, non-pharmacological care, and counseling</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-3">
        {/* Informative banner clarifying scope */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100">Clinical Management Plan: </span>
            <span>
              Document overall care directives, rehabilitation, lifestyle modifications, precautions, and dietary recommendations. Pharmacological prescriptions are managed below.
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="treatment-plan-text" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
            Doctor's Treatment Plan & Recommendations
          </label>
          <textarea
            id="treatment-plan-text"
            rows={5}
            placeholder="Enter treatment plan, physical therapy advice, activity restrictions, warning signs, patient counseling, and general care plan..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            <span>Doctor's clinical plan documentation</span>
            <span>{value ? `${value.length} characters` : 'Optional'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
