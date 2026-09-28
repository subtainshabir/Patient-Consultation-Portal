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
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <FileEdit className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Additional Observations</CardTitle>
            <p className="text-xs text-navy-500">Unstructured clinical observations, unique findings, or general consultation notes</p>
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
          className="w-full px-3.5 py-3 text-xs sm:text-sm text-navy-900 bg-white border border-navy-200 rounded-xl placeholder:text-navy-400 focus:outline-hidden focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors leading-relaxed"
        />
      </CardContent>
    </Card>
  );
};
