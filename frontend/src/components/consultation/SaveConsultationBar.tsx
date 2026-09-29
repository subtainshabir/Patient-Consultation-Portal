import React from 'react';
import { Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface SaveConsultationBarProps {
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  hasErrors?: boolean;
  symptomCount?: number;
  examinationsCount?: number;
  diagnosticTestCount?: number;
  prescriptionCount?: number;
  hasFollowUp?: boolean;
  isEditMode?: boolean;
  onCancel?: () => void;
}

export const SaveConsultationBar: React.FC<SaveConsultationBarProps> = ({
  onSave,
  isSaving,
  isDirty,
  hasErrors = false,
  symptomCount = 0,
  examinationsCount = 0,
  diagnosticTestCount = 0,
  prescriptionCount = 0,
  hasFollowUp = false,
  isEditMode = false,
  onCancel,
}) => {
  return (
    <div className="sticky bottom-0 z-20 mt-8 py-3.5 px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shadow-elevated rounded-t-2xl">

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Summary / Status indicator */}
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            {hasErrors ? (
              <span className="inline-flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                Validation errors
              </span>
            ) : isDirty ? (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-medium text-slate-500 dark:text-slate-400 text-[11px]">
                <CheckCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                Form ready
              </span>
            )}

            <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>

            <span className="hidden sm:inline text-slate-600 dark:text-slate-400">
              {symptomCount} {symptomCount === 1 ? 'symptom' : 'symptoms'}, {examinationsCount} exam findings, {diagnosticTestCount} tests{prescriptionCount > 0 ? `, ${prescriptionCount} ${prescriptionCount === 1 ? 'medicine' : 'medicines'}` : ''}{hasFollowUp ? ', Follow-up configured' : ''}
            </span>

          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onCancel && (
            <Button
              variant="outline"
              size="md"
              onClick={onCancel}
              disabled={isSaving}
              className="text-xs sm:text-sm"
            >
              Cancel
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onSave}
            disabled={isSaving}
            isLoading={isSaving}
            leftIcon={!isSaving ? <Save className="w-4 h-4" /> : undefined}
            className="w-full sm:w-auto shadow-md font-bold px-6 text-sm"
            id="save-consultation-btn"
          >
            {isSaving
              ? isEditMode
                ? 'Updating Consultation...'
                : 'Saving Consultation...'
              : isEditMode
              ? 'Update Consultation'
              : 'Save Consultation'}
          </Button>
        </div>
      </div>
    </div>
  );
};
