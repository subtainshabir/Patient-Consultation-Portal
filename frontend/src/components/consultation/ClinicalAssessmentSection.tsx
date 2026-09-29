import React from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface ClinicalAssessmentSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export const ClinicalAssessmentSection: React.FC<ClinicalAssessmentSectionProps> = ({
  value,
  onChange,
}) => {
  return (
    <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <CardHeader className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Clinical Assessment</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Overall clinical diagnostic impression and medical synthesis</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-2">
        <label htmlFor="clinical-assessment-text" className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
          Doctor's Assessment & Clinical Impression
        </label>
        <textarea
          id="clinical-assessment-text"
          rows={5}
          placeholder="Enter overall clinical assessment, provisional/differential diagnoses, disease stage, and clinical reasoning..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors leading-relaxed"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Clinical documentation field for physician</span>
          <span>{value ? `${value.length} characters` : 'Optional'}</span>
        </div>
      </CardContent>
    </Card>
  );
};
