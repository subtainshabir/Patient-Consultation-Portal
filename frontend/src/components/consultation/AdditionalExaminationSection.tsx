import React from 'react';
import { Eye } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

export interface AdditionalExaminationSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export const AdditionalExaminationSection: React.FC<AdditionalExaminationSectionProps> = ({
  value,
  onChange,
}) => {
  return (
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Additional Examination</CardTitle>
            <p className="text-xs text-navy-500">General physical and systemic findings outside the structured neurological exam</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-2">
        <label htmlFor="additional-examination-text" className="block text-xs font-semibold text-navy-800">
          General Physical & Systemic Examination Findings
        </label>
        <textarea
          id="additional-examination-text"
          rows={4}
          placeholder="Enter additional examination findings (e.g. general appearance, cardiovascular, respiratory, abdominal, or dermatological signs)..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs text-navy-900 bg-white border border-navy-200 rounded-xl placeholder:text-navy-400 focus:outline-hidden focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors leading-relaxed"
        />
        <div className="flex items-center justify-between text-[11px] text-navy-400">
          <span>Non-neurological systemic examination notes</span>
          <span>{value ? `${value.length} characters` : 'Optional'}</span>
        </div>
      </CardContent>
    </Card>
  );
};
