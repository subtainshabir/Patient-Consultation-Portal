import React from 'react';
import { ArrowLeft, History, ExternalLink, Calendar, User, Phone } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import type { Patient } from '../../types/patient';

export interface ConsultationHeaderProps {
  patient: Patient;
  serverDateFormatted: string;
  onBack: () => void;
  onOpenHistory: () => void;
  onViewPatient: () => void;
  historyCount?: number;
}

export const ConsultationHeader: React.FC<ConsultationHeaderProps> = ({
  patient,
  serverDateFormatted,
  onBack,
  onOpenHistory,
  onViewPatient,
  historyCount = 0,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="border-navy-200 text-navy-700 hover:bg-navy-50"
          id="consultation-back-btn"
        >
          Back to Patient
        </Button>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHistory}
            leftIcon={<History className="w-4 h-4 text-medical-600" />}
            className="border-medical-200 bg-medical-50/50 text-medical-800 hover:bg-medical-100 font-medium"
            id="view-medical-history-btn"
          >
            View Medical History
            {historyCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-medical-600 text-white">
                {historyCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onViewPatient}
            rightIcon={<ExternalLink className="w-3.5 h-3.5 text-navy-400" />}
            className="text-navy-600 hover:text-navy-900"
            id="view-patient-profile-btn"
          >
            View Patient
          </Button>
        </div>
      </div>

      {/* Patient Information & Consultation Date Card */}
      <Card className="border-medical-200 bg-gradient-to-r from-medical-50/60 via-white to-navy-50/50 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Patient Details */}
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-medical-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-medical-100/80 text-medical-900 border border-medical-200">
                    {patient.patient_id}
                  </span>
                  <h1 className="text-base sm:text-lg font-bold text-navy-950">
                    {patient.full_name}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-600 mt-1 font-medium">
                  <span>{patient.age} years</span>
                  <span className="text-navy-300">•</span>
                  <span>{patient.gender}</span>
                  <span className="text-navy-300">•</span>
                  <span className="inline-flex items-center gap-1 font-mono text-navy-700">
                    <Phone className="w-3 h-3 text-navy-400" />
                    {patient.mobile_number}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Authoritative Consultation Date */}
            <div className="flex items-center gap-3 self-start md:self-auto bg-white/90 px-3.5 py-2 rounded-xl border border-navy-200/80 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-medical-600" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-navy-400">
                  Consultation Date
                </div>
                <div className="text-xs sm:text-sm font-bold text-navy-900">
                  {serverDateFormatted || 'Loading server date...'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
