import React from 'react';
import { HeartPulse } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ClinicalSelect } from '../clinical/ClinicalSelect';
import type { MasterDataItem } from '../../types/masterData';


export interface PatientStateSectionProps {
  selectedStateName: string;
  selectedStateId?: number | null;
  onChange: (stateName: string, stateId?: number | null) => void;
}

export const PatientStateSection: React.FC<PatientStateSectionProps> = ({
  selectedStateName,
  onChange,
}) => {
  const handleChange = (val: string, item?: MasterDataItem) => {
    onChange(val, item?.id ?? null);
  };

  return (
    <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <CardHeader className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Patient Clinical State</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Overall clinical assessment state for this consultation</p>
          </div>
        </div>

        {selectedStateName && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
            {selectedStateName}
          </span>
        )}
      </CardHeader>

      <CardContent className="p-5">
        <div className="max-w-md">
          <ClinicalSelect
            categoryKey="patient-states"
            label="Patient State"
            id="patient_state_select"
            placeholder="Select state (Stable, Acute, Chronic, Improving...)"
            value={selectedStateName}
            onChange={handleChange}
            allowAddNew={true}
          />
        </div>
      </CardContent>
    </Card>
  );
};
