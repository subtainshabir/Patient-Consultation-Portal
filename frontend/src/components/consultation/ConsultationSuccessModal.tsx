import React from 'react';
import { CheckCircle2, ArrowLeft, Eye } from 'lucide-react';

import { Dialog, DialogContent, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';

export interface ConsultationSuccessModalProps {
  isOpen: boolean;
  consultationId: string;
  patientName: string;
  patientId: string;
  consultationDate: string;
  onViewConsultation: () => void;
  onBackToPatient: () => void;
}

export const ConsultationSuccessModal: React.FC<ConsultationSuccessModalProps> = ({
  isOpen,
  consultationId,
  patientName,
  patientId,
  consultationDate,
  onViewConsultation,
  onBackToPatient,
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onBackToPatient} maxWidth="sm">
      <DialogContent className="pt-8 pb-4 text-center">
        {/* Animated Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm animate-in zoom-in-75 duration-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-navy-950 tracking-tight mb-1">
          Consultation Saved Successfully
        </h2>
        <p className="text-xs text-navy-600 mb-6">
          The clinical consultation record has been securely stored in the medical database.
        </p>

        {/* Saved Record Details Card */}
        <div className="bg-navy-50/70 border border-navy-200 rounded-xl p-4 text-left space-y-2.5 text-xs text-navy-800">
          <div className="flex items-center justify-between pb-2 border-b border-navy-200/60">
            <span className="text-navy-500 font-medium">Consultation ID:</span>
            <span className="font-mono font-bold text-navy-950">{consultationId}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-navy-500 font-medium">Patient:</span>
            <span className="font-semibold text-navy-900">{patientName} ({patientId})</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-navy-500 font-medium">Consultation Date:</span>
            <span className="font-semibold text-navy-900">{consultationDate}</span>
          </div>
        </div>
      </DialogContent>

      <DialogFooter className="flex-col sm:flex-row gap-2.5 sm:justify-center p-4">
        <Button
          variant="outline"
          size="md"
          onClick={onBackToPatient}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="w-full sm:w-auto"
          id="success-back-to-patient-btn"
        >
          Back to Patient
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={onViewConsultation}
          leftIcon={<Eye className="w-4 h-4" />}
          className="w-full sm:w-auto"
          id="success-view-consultation-btn"
        >
          View Consultation
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
