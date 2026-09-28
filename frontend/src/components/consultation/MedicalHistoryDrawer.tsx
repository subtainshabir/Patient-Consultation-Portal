import React from 'react';
import { History, Calendar, Clock, ChevronRight, Activity } from 'lucide-react';

import { Dialog, DialogHeader, DialogContent } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import type { ConsultationSummary } from '../../types/consultation';

export interface MedicalHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  consultations: ConsultationSummary[];
  isLoading: boolean;
  onSelectConsultation: (consultationId: string) => void;
  patientName: string;
}

export const MedicalHistoryDrawer: React.FC<MedicalHistoryDrawerProps> = ({
  isOpen,
  onClose,
  consultations,
  isLoading,
  onSelectConsultation,
  patientName,
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <DialogHeader
        title="Medical History"
        description={`Previous clinical consultations for ${patientName}`}
        onClose={onClose}
      />
      <DialogContent className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-navy-500">
            <Clock className="w-8 h-8 animate-spin text-medical-600" />
            <p className="text-sm">Loading consultation history...</p>
          </div>
        ) : consultations.length === 0 ? (
          <EmptyState
            icon={History}
            title="No previous consultation history."
            description="This patient has no prior recorded clinical consultations."
            action={
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-navy-500 font-medium px-1">
              Found {consultations.length} previous {consultations.length === 1 ? 'record' : 'records'}:
            </p>

            <div className="divide-y divide-navy-100 rounded-xl border border-navy-200 overflow-hidden bg-white">
              {consultations.map((item) => {
                const dateObj = new Date(item.consultation_date);
                const formattedDate = dateObj.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={item.consultation_id}
                    onClick={() => {
                      onSelectConsultation(item.consultation_id);
                    }}
                    className="p-4 hover:bg-navy-50/80 cursor-pointer transition-colors flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-navy-900">
                          {item.consultation_id}
                        </span>
                        <span className="text-xs text-navy-300">•</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-700">
                          <Calendar className="w-3.5 h-3.5 text-medical-600" />
                          {formattedDate}
                        </span>
                        {item.patient_state_name && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy-100 text-navy-700">
                            {item.patient_state_name}
                          </span>
                        )}
                      </div>

                      {/* Key Indicators Preview */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-500">
                        {item.bp_formatted && (
                          <span className="inline-flex items-center gap-1 font-mono text-navy-700">
                            <Activity className="w-3 h-3 text-medical-600" />
                            {item.bp_formatted}
                          </span>
                        )}
                        {item.pulse_rate && <span>{item.pulse_rate} bpm</span>}
                        {item.temperature && <span>{item.temperature}°C</span>}
                        {item.symptom_count > 0 && (
                          <span>
                            {item.symptom_count} {item.symptom_count === 1 ? 'symptom' : 'symptoms'}
                          </span>
                        )}
                        {item.mmse_score !== null && item.mmse_score !== undefined && (
                          <span className="font-medium text-navy-700">MMSE: {item.mmse_score}/30</span>
                        )}
                        {item.gcs_score !== null && item.gcs_score !== undefined && (
                          <span className="font-medium text-navy-700">GCS: {item.gcs_score}/15</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-medical-700 group-hover:translate-x-0.5 transition-transform shrink-0">
                      <span>View</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
