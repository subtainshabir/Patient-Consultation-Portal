import React, { useState } from 'react';
import { HelpCircle, BrainCircuit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';

export interface MentalStatusScoresCardProps {
  mmseScore: number | null | undefined;
  gcsScore: number | null | undefined;
  onChangeMmse: (score: number | null) => void;
  onChangeGcs: (score: number | null) => void;
  errors?: Record<string, string>;
}

export const MentalStatusScoresCard: React.FC<MentalStatusScoresCardProps> = ({
  mmseScore,
  gcsScore,
  onChangeMmse,
  onChangeGcs,
  errors = {},
}) => {
  const [showMmseHelp, setShowMmseHelp] = useState(false);
  const [showGcsHelp, setShowGcsHelp] = useState(false);

  const handleScoreChange = (
    val: string,
    setter: (n: number | null) => void,
    min: number,
    max: number
  ) => {
    if (val === '') {
      setter(null);
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= min && num <= max) {

      setter(num);
    }
  };

  return (
    <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <CardHeader className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Mental Status Scores</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Standardized cognitive and neurological responsiveness scores</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* MMSE Score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="mmse_score_input" className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>MMSE Score</span>
                <button
                  type="button"
                  onClick={() => setShowMmseHelp((prev) => !prev)}
                  className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  aria-label="MMSE information"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Scale: 0 – 30</span>
            </div>
            <Input
              id="mmse_score_input"
              type="number"
              placeholder="e.g. 28"
              value={mmseScore ?? ''}
              onChange={(e) => handleScoreChange(e.target.value, onChangeMmse, 0, 30)}
              rightElement={<span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/ 30</span>}
              error={errors.mmse_score}
              min={0}
              max={30}
            />
            {showMmseHelp && (
              <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl leading-relaxed animate-in fade-in">
                <strong>Mini-Mental State Examination (MMSE):</strong> 30-point questionnaire used extensively in clinical settings to measure cognitive impairment.
                Scores ≥24 are generally considered normal cognition.
              </p>
            )}
          </div>

          {/* GCS Score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="gcs_score_input" className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>GCS Score</span>
                <button
                  type="button"
                  onClick={() => setShowGcsHelp((prev) => !prev)}
                  className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  aria-label="GCS information"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Scale: 3 – 15</span>
            </div>
            <Input
              id="gcs_score_input"
              type="number"
              placeholder="e.g. 15"
              value={gcsScore ?? ''}
              onChange={(e) => handleScoreChange(e.target.value, onChangeGcs, 3, 15)}
              rightElement={<span className="text-xs text-slate-400 dark:text-slate-500 font-medium">/ 15</span>}
              error={errors.gcs_score}
              min={3}
              max={15}
            />
            {showGcsHelp && (
              <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl leading-relaxed animate-in fade-in">
                <strong>Glasgow Coma Scale (GCS):</strong> Objective scoring system assessing consciousness level (Eye Opening 1–4, Verbal Response 1–5, Motor Response 1–6).
                Scores range from 3 (deep coma) to 15 (fully awake).
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
