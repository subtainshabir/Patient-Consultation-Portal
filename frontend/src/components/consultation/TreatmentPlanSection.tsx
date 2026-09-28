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
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Treatment Plan</CardTitle>
            <p className="text-xs text-navy-500">Therapeutic strategy, non-pharmacological care, and counseling</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-3">
        {/* Informative banner clarifying scope */}
        <div className="p-3 rounded-xl bg-navy-50/70 border border-navy-200 flex items-start gap-2.5 text-xs text-navy-700">
          <Info className="w-4 h-4 text-medical-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-navy-900">Clinical Management Plan: </span>
            <span>
              Document overall care directives, rehabilitation, lifestyle modifications, precautions, and dietary recommendations. Pharmacological prescriptions will be managed in Phase 6.
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="treatment-plan-text" className="block text-xs font-semibold text-navy-800 mb-1.5">
            Doctor's Treatment Plan & Recommendations
          </label>
          <textarea
            id="treatment-plan-text"
            rows={5}
            placeholder="Enter treatment plan, physical therapy advice, activity restrictions, warning signs, patient counseling, and general care plan..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs text-navy-900 bg-white border border-navy-200 rounded-xl placeholder:text-navy-400 focus:outline-hidden focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-navy-400 mt-1.5">
            <span>Doctor's clinical plan documentation</span>
            <span>{value ? `${value.length} characters` : 'Optional'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
