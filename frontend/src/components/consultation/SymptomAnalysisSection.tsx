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
    <Card className="border-slate-200/90 dark:border-slate-800 shadow-2xs">
      <CardHeader className="pb-3.5 border-b border-slate-100 dark:border-slate-800/80 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 border border-primary-100 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Symptom Analysis</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Chief complaints and presenting neurological symptoms</p>
          </div>
        </div>

        {symptoms.length > 0 && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300">
            {symptoms.length} {symptoms.length === 1 ? 'symptom' : 'symptoms'}
          </span>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Searchable Multi-Select using Master Data */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
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

        {/* Symptom Details / Clinical Notes */}
        <div>
          <label htmlFor="symptom_notes" className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Symptom Details / Clinical Notes</span>
          </label>
          <textarea
            id="symptom_notes"
            rows={3}
            placeholder="Describe symptom onset, duration, progression, aggravating or relieving factors, associated complaints..."
            value={symptomNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>
      </CardContent>
    </Card>
  );
};
