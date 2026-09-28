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
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <HeartPulse className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Patient Clinical State</CardTitle>
            <p className="text-xs text-navy-500">Overall clinical assessment state for this consultation</p>
          </div>
        </div>

        {selectedStateName && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-medical-50 border border-medical-200 text-medical-800">
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
