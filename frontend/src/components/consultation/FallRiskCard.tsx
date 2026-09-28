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
    <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white shadow-sm">
      <CardHeader className="pb-3 border-b border-amber-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Fall Risk Assessment</CardTitle>
            <p className="text-xs text-navy-500">Screening for gait instability and risk of falling</p>
          </div>
        </div>

        {/* Status Pill */}
        {status && (
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-semibold border',
              status === 'Done'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-navy-100 text-navy-700 border-navy-200'
            )}
          >
            {status}
          </span>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Toggle buttons for Done / Not Done */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-2">
            Assessment Status
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChangeStatus(status === 'Done' ? null : 'Done')}
              className={cn(
                'flex-1 sm:flex-initial min-w-[130px] h-10 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2',
                status === 'Done'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50 hover:border-navy-300'
              )}
            >
              <CheckCircle2 className={cn('w-4 h-4', status === 'Done' ? 'text-white' : 'text-emerald-600')} />
              <span>Done</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeStatus(status === 'Not Done' ? null : 'Not Done')}
              className={cn(
                'flex-1 sm:flex-initial min-w-[130px] h-10 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2',
                status === 'Not Done'
                  ? 'bg-navy-700 text-white border-navy-700 shadow-sm'
                  : 'bg-white text-navy-700 border-navy-200 hover:bg-navy-50 hover:border-navy-300'
              )}
            >
              <XCircle className={cn('w-4 h-4', status === 'Not Done' ? 'text-white' : 'text-navy-400')} />
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
