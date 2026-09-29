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
          className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          id="consultation-back-btn"
        >
          Back to Patient
        </Button>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHistory}
            leftIcon={<History className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
            className="border-primary-200 dark:border-primary-800/80 bg-primary-50/50 dark:bg-primary-950/40 text-primary-800 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/60 font-medium"
            id="view-medical-history-btn"
          >
            View Medical History
            {historyCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-600 text-white">
                {historyCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onViewPatient}
            rightIcon={<ExternalLink className="w-3.5 h-3.5 text-slate-400" />}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            id="view-patient-profile-btn"
          >
            View Patient
          </Button>
        </div>
      </div>

      {/* Patient Information & Consultation Date Card */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Patient Details */}
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 border border-primary-200 dark:border-primary-800/60">
                    {patient.patient_id}
                  </span>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {patient.full_name}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  <span>{patient.age} years</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span>{patient.gender}</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="inline-flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {patient.mobile_number}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Authoritative Consultation Date */}
            <div className="flex items-center gap-3 self-start md:self-auto bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                  Consultation Date
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
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
