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
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Mental Status Scores</CardTitle>
            <p className="text-xs text-navy-500">Standardized cognitive and neurological responsiveness scores</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* MMSE Score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="mmse_score_input" className="text-xs font-semibold text-navy-800 flex items-center gap-1.5">
                <span>MMSE Score</span>
                <button
                  type="button"
                  onClick={() => setShowMmseHelp((prev) => !prev)}
                  className="text-navy-400 hover:text-medical-600 transition-colors"
                  aria-label="MMSE information"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className="text-[11px] text-navy-400">Scale: 0 – 30</span>
            </div>
            <Input
              id="mmse_score_input"
              type="number"
              placeholder="e.g. 28"
              value={mmseScore ?? ''}
              onChange={(e) => handleScoreChange(e.target.value, onChangeMmse, 0, 30)}
              rightElement={<span className="text-xs text-navy-400 font-medium">/ 30</span>}
              error={errors.mmse_score}
              min={0}
              max={30}
            />
            {showMmseHelp && (
              <p className="mt-1.5 text-[11px] text-navy-500 bg-navy-50 p-2 rounded-lg leading-relaxed animate-in fade-in">
                <strong>Mini-Mental State Examination (MMSE):</strong> 30-point questionnaire used extensively in clinical settings to measure cognitive impairment.
                Scores ≥24 are generally considered normal cognition.
              </p>
            )}
          </div>

          {/* GCS Score */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="gcs_score_input" className="text-xs font-semibold text-navy-800 flex items-center gap-1.5">
                <span>GCS Score</span>
                <button
                  type="button"
                  onClick={() => setShowGcsHelp((prev) => !prev)}
                  className="text-navy-400 hover:text-medical-600 transition-colors"
                  aria-label="GCS information"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </label>
              <span className="text-[11px] text-navy-400">Scale: 3 – 15</span>
            </div>
            <Input
              id="gcs_score_input"
              type="number"
              placeholder="e.g. 15"
              value={gcsScore ?? ''}
              onChange={(e) => handleScoreChange(e.target.value, onChangeGcs, 3, 15)}
              rightElement={<span className="text-xs text-navy-400 font-medium">/ 15</span>}
              error={errors.gcs_score}
              min={3}
              max={15}
            />
            {showGcsHelp && (
              <p className="mt-1.5 text-[11px] text-navy-500 bg-navy-50 p-2 rounded-lg leading-relaxed animate-in fade-in">
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
