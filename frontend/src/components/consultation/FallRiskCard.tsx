import React from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

export interface FallRiskCardProps {
  status: 'Done' | 'Not Done' | null | undefined;
  notes: string | null | undefined;
  onChangeStatus: (status: 'Done' | 'Not Done' | null) => void;
  onChangeNotes: (notes: string) => void;
}

export const FallRiskCard: React.FC<FallRiskCardProps> = ({
  status,
  notes,
  onChangeStatus,
  onChangeNotes,
}) => {
  return (
    <Card className="border-amber-200/80 dark:border-amber-900/50 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="pb-3 border-b border-amber-100 dark:border-slate-800 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Fall Risk Assessment</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Screening for gait instability and risk of falling</p>
          </div>
        </div>

        {/* Status Pill */}
        {status && (
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
              status === 'Done'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            )}
          >
            {status}
          </span>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Toggle buttons for Done / Not Done */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            Assessment Status
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChangeStatus(status === 'Done' ? null : 'Done')}
              className={cn(
                'flex-1 sm:flex-initial min-w-[130px] h-10 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2',
                status === 'Done'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              )}
            >
              <CheckCircle2 className={cn('w-4 h-4', status === 'Done' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400')} />
              <span>Done</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeStatus(status === 'Not Done' ? null : 'Not Done')}
              className={cn(
                'flex-1 sm:flex-initial min-w-[130px] h-10 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2',
                status === 'Not Done'
                  ? 'bg-slate-700 dark:bg-slate-600 text-white border-slate-700 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              )}
            >
              <XCircle className={cn('w-4 h-4', status === 'Not Done' ? 'text-white' : 'text-slate-400 dark:text-slate-500')} />
              <span>Not Done</span>
            </button>
          </div>
        </div>

        {/* Assessment Notes */}
        <div>
          <Input
            label="Assessment Notes"
            id="fall_risk_notes"
            placeholder={
              status === 'Done'
                ? 'e.g. Unsteady gait, history of fall 1 month ago, uses walking stick'
                : 'Optional notes (e.g. Patient bedridden or wheelchair bound)'
            }
            value={notes ?? ''}
            onChange={(e) => onChangeNotes(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
