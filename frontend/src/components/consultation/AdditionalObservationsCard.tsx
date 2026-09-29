import React from 'react';
import { FileEdit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface AdditionalObservationsCardProps {
  observations: string;
  onChange: (value: string) => void;
}

export const AdditionalObservationsCard: React.FC<AdditionalObservationsCardProps> = ({
  observations,
  onChange,
}) => {
  return (
    <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <CardHeader className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <FileEdit className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Additional Observations</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Unstructured clinical observations, unique findings, or general consultation notes</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <textarea
          id="additional_observations_textarea"
          rows={5}
          placeholder="Record any clinical impressions, atypical presentations, family comments, posture or demeanor notes, or examination details that do not fit into predefined checkboxes or dropdowns..."
          value={observations}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors leading-relaxed"
        />
      </CardContent>
    </Card>
  );
};
