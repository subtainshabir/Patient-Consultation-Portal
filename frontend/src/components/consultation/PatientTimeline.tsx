import React from 'react';
import {
  Calendar,
  Stethoscope,
  Activity,
  FlaskConical,
  Pill,
  CalendarClock,
  Eye,
  Edit3,
  FileText,
  Printer,
} from 'lucide-react';
import type { ConsultationSummary } from '../../types/consultation';
import { Button } from '../ui/Button';

export interface PatientTimelineProps {
  consultations: ConsultationSummary[];
  onSelectConsultation: (consultationId: string) => void;
  onEditConsultation: (consultationId: string) => void;
  onViewReport?: (consultationId: string) => void;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({
  consultations,
  onSelectConsultation,
  onEditConsultation,
  onViewReport,
}) => {
  if (consultations.length === 0) {
    return null;
  }

  // Group or sort consultations chronologically (newest first or oldest first)
  return (
    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-navy-200">
      {consultations.map((item) => {
        const dateObj = new Date(item.consultation_date);
        const fullDateStr = dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        // Determine follow up badge color
        const followUpStatus = item.follow_up_status || 'No Follow-Up';
        const isFollowUpCompleted = followUpStatus === 'Completed';
        const isFollowUpOverdue = followUpStatus === 'Overdue';
        const isFollowUpScheduled = followUpStatus === 'Scheduled';

        return (
          <div key={item.consultation_id} className="relative group">
            {/* Timeline node icon */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-medical-600 flex items-center justify-center text-medical-700 shadow-xs z-10 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>

            {/* Timeline content card */}
            <div className="bg-white rounded-xl border border-navy-200 shadow-xs p-4 sm:p-5 hover:border-medical-300 hover:shadow-sm transition-all space-y-3.5">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-navy-950 px-2 py-0.5 bg-navy-50 rounded-md border border-navy-200">
                    {item.consultation_id}
                  </span>
                  <span className="text-navy-300">•</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800">
                    <Calendar className="w-3.5 h-3.5 text-medical-600" />
                    <span>{fullDateStr}</span>
                  </span>
                  {item.patient_state_name && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-medical-50 border border-medical-200 text-medical-800">
                      {item.patient_state_name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {onViewReport && (
                    item.has_report ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewReport(item.consultation_id)}
                        leftIcon={<FileText className="w-3.5 h-3.5 text-medical-600" />}
                        className="text-xs font-semibold text-medical-800 border-medical-200 bg-medical-50/50 hover:bg-medical-100"
                        title="View stored PDF prescription report"
                      >
                        View PDF
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewReport(item.consultation_id)}
                        leftIcon={<Printer className="w-3.5 h-3.5 text-navy-500" />}
                        className="text-xs text-navy-600 hover:text-navy-950"
                        title="Generate PDF prescription report"
                      >
                        Generate Report
                      </Button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectConsultation(item.consultation_id)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    View Record
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditConsultation(item.consultation_id)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-navy-500" />}
                    className="text-xs text-navy-600 hover:text-navy-950"
                  >
                    Edit
                  </Button>
                </div>
              </div>

              {/* Structured Timeline Branches */}
              <div className="space-y-2 text-xs">
                {/* Branch 1: Symptoms */}
                {item.symptoms_summary && item.symptoms_summary.length > 0 ? (
                  <div className="flex items-start gap-2.5 pl-2 border-l-2 border-amber-300">
                    <span className="font-semibold text-navy-500 w-24 shrink-0">Symptoms:</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {item.symptoms_summary.map((symp, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium"
                        >
                          {symp}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : item.symptom_count > 0 ? (
                  <div className="flex items-center gap-2.5 pl-2 border-l-2 border-amber-300">
                    <span className="font-semibold text-navy-500 w-24 shrink-0">Symptoms:</span>
                    <span className="text-navy-800">{item.symptom_count} symptoms documented</span>
                  </div>
                ) : null}

                {/* Branch 2: Vital Signs */}
                {item.has_vitals && (
                  <div className="flex items-center gap-2.5 pl-2 border-l-2 border-medical-400">
                    <span className="font-semibold text-navy-500 w-24 shrink-0">Vitals:</span>
                    <div className="flex flex-wrap items-center gap-3 text-navy-700">
                      {item.bp_formatted && (
                        <span className="inline-flex items-center gap-1 font-mono font-medium">
                          <Activity className="w-3 h-3 text-medical-600" />
                          {item.bp_formatted}
                        </span>
                      )}
                      {item.pulse_rate && <span>{item.pulse_rate} bpm</span>}
                      {item.temperature && <span>{item.temperature} °C</span>}
                      {item.mmse_score !== null && item.mmse_score !== undefined && (
                        <span>MMSE: {item.mmse_score}/30</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Branch 3: Diagnostic Tests */}
                {item.diagnostic_test_count !== undefined && item.diagnostic_test_count > 0 && (
                  <div className="flex items-center gap-2.5 pl-2 border-l-2 border-indigo-400">
                    <span className="font-semibold text-navy-500 w-24 shrink-0">Tests:</span>
                    <span className="inline-flex items-center gap-1 text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-medium">
                      <FlaskConical className="w-3 h-3 text-indigo-600" />
                      {item.diagnostic_test_count}{' '}
                      {item.diagnostic_test_count === 1 ? 'diagnostic test' : 'diagnostic tests'}
                    </span>
                  </div>
                )}

                {/* Branch 4: Prescriptions */}
                {item.prescription_count !== undefined && item.prescription_count > 0 && (
                  <div className="flex items-center gap-2.5 pl-2 border-l-2 border-emerald-400">
                    <span className="font-semibold text-navy-500 w-24 shrink-0">Prescription:</span>
                    <span className="inline-flex items-center gap-1 text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      <Pill className="w-3 h-3 text-emerald-600" />
                      {item.prescription_count}{' '}
                      {item.prescription_count === 1 ? 'medicine prescribed' : 'medicines prescribed'}
                    </span>
                  </div>
                )}

                {/* Branch 5: Follow-Up */}
                {(item.follow_up_period || item.follow_up_date) && (
                  <div className="flex items-start gap-2.5 pl-2 border-l-2 border-sky-400 pt-1">
                    <span className="font-semibold text-navy-500 w-24 shrink-0 flex items-center gap-1">
                      <CalendarClock className="w-3 h-3 text-sky-600" />
                      <span>Follow-Up:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.follow_up_period && (
                        <span className="font-semibold text-navy-900">
                          {item.follow_up_period}
                        </span>
                      )}
                      {item.follow_up_date && (
                        <span className="text-navy-600">
                          (Target:{' '}
                          {new Date(item.follow_up_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                          )
                        </span>
                      )}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                          isFollowUpCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isFollowUpOverdue
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : isFollowUpScheduled
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : 'bg-navy-50 text-navy-700 border-navy-200'
                        }`}
                      >
                        {followUpStatus}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
