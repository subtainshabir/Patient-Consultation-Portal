import React from 'react';
import { Stethoscope, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ClinicalMultiSelect } from '../clinical/ClinicalMultiSelect';
import type { ConsultationSymptom } from '../../types/consultation';
import type { MasterDataItem, Symptom } from '../../types/masterData';

export interface SymptomAnalysisSectionProps {
  symptoms: ConsultationSymptom[];
  symptomNotes: string;
  onSymptomsChange: (symptoms: ConsultationSymptom[]) => void;
  onNotesChange: (notes: string) => void;
}

export const SymptomAnalysisSection: React.FC<SymptomAnalysisSectionProps> = ({
  symptoms,
  symptomNotes,
  onSymptomsChange,
  onNotesChange,
}) => {
  // Extract string values for ClinicalMultiSelect
  const symptomNames = symptoms.map((s) => s.symptom_name);

  const handleSelectChange = (newNames: string[], selectedItems?: MasterDataItem[]) => {
    // Merge new names with any existing symptom objects to preserve categories/ids
    const updatedSymptoms: ConsultationSymptom[] = newNames.map((name, idx) => {
      const existing = symptoms.find((s) => s.symptom_name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return existing;
      }
      const matchedMaster = selectedItems?.find(
        (m) => m.name.toLowerCase() === name.toLowerCase()
      ) as Symptom | undefined;

      return {
        symptom_name: name,
        symptom_id: matchedMaster ? matchedMaster.id : null,
        category: matchedMaster ? matchedMaster.category : 'General',
        sort_order: idx,
      };
    });

    onSymptomsChange(updatedSymptoms);
  };

  return (
    <Card className="border-navy-200 shadow-sm">
      <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-medical-50 text-medical-700 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-navy-950">Symptom Analysis</CardTitle>
            <p className="text-xs text-navy-500">Chief complaints and presenting neurological symptoms</p>
          </div>
        </div>

        {symptoms.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-medical-50 border border-medical-200 text-medical-800">
            {symptoms.length} {symptoms.length === 1 ? 'symptom selected' : 'symptoms selected'}
          </span>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Searchable Multi-Select using Phase 3 Master Data */}
        <div>
          <label className="block text-xs font-semibold text-navy-800 mb-1.5">
            Search & Select Symptoms
          </label>
          <ClinicalMultiSelect
            categoryKey="symptoms"
            placeholder="Search symptoms (e.g. Headache, Dizziness, Seizure, Numbness)..."
            values={symptomNames}
            onChange={handleSelectChange}
            allowAddNew={true}
          />
        </div>

        {/* Symptom Details / Clinical Notes (Section 17) */}
        <div>
          <label htmlFor="symptom_notes" className="block text-xs font-semibold text-navy-800 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-navy-400" />
            <span>Symptom Details / Clinical Notes</span>
          </label>
          <textarea
            id="symptom_notes"
            rows={3}
            placeholder="Describe symptom onset, duration, progression, aggravating or relieving factors, associated complaints..."
            value={symptomNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs text-navy-900 bg-white border border-navy-200 rounded-xl placeholder:text-navy-400 focus:outline-hidden focus:border-medical-500 focus:ring-1 focus:ring-medical-500 transition-colors"
          />
        </div>
      </CardContent>
    </Card>
  );
};
