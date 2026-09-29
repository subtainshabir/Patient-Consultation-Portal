import React from 'react';
import {
  Calendar,
  Stethoscope,
  CalendarClock,
  Edit3,
  FileText,
  Printer,
  Download,
} from 'lucide-react';
import type { ConsultationSummary } from '../../types/consultation';
import { Button } from '../ui/Button';

export interface PatientTimelineProps {
  consultations: ConsultationSummary[];
  onViewReport: (consultationId: string) => void;
  onEditConsultation: (consultationId: string) => void;
  onDownloadReport?: (item: ConsultationSummary) => void;
  onSelectConsultation?: (consultationId: string) => void;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({
  consultations,
  onViewReport,
  onEditConsultation,
  onDownloadReport,
}) => {
  if (consultations.length === 0) {
    return null;
  }

  return (
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-navy-200">
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
            <div className="bg-white rounded-xl border border-navy-200 shadow-xs p-4 sm:p-5 hover:border-medical-300 hover:shadow-sm transition-all space-y-2.5">
              {/* Header row with Registration No, Date, State, and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-100 pb-3">
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
                  {(item.follow_up_date || item.follow_up_period) && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isFollowUpCompleted
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : isFollowUpOverdue
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : isFollowUpScheduled
                          ? 'bg-sky-50 text-sky-800 border-sky-200'
                          : 'bg-navy-50 text-navy-700 border-navy-200'
                      }`}
                    >
                      Follow-Up: {followUpStatus}
                    </span>
                  )}
                </div>

                {/* Actions: [View Report] [Edit] [Download PDF] */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {item.has_report ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewReport(item.consultation_id)}
                      leftIcon={<FileText className="w-3.5 h-3.5 text-medical-600" />}
                      className="text-xs font-semibold text-medical-800 border-medical-200 bg-medical-50/50 hover:bg-medical-100"
                      title="View stored PDF prescription report"
                    >
                      View Report
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
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditConsultation(item.consultation_id)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-navy-500" />}
                    className="text-xs text-navy-600 hover:text-navy-950"
                    title="Edit consultation"
                  >
                    Edit
                  </Button>

                  {item.has_report && onDownloadReport && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadReport(item)}
                      leftIcon={<Download className="w-3.5 h-3.5 text-navy-600" />}
                      className="text-xs text-navy-700 hover:text-navy-950 border-navy-200 hover:bg-navy-50"
                      title="Download stored PDF report"
                    >
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>

              {/* Follow-Up Details if present */}
              {(item.follow_up_period || item.follow_up_date || item.follow_up_instructions) && (
                <div className="text-xs text-navy-600 flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="font-semibold text-navy-700 flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Follow-Up:</span>
                  </span>
                  {item.follow_up_period && (
                    <span className="font-medium text-navy-900">{item.follow_up_period}</span>
                  )}
                  {item.follow_up_date && (
                    <span className="text-navy-600">
                      ({new Date(item.follow_up_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })})
                    </span>
                  )}
                  {item.follow_up_instructions && (
                    <span className="text-navy-500 italic line-clamp-1">
                      — {item.follow_up_instructions}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
