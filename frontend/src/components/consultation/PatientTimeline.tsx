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
    <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-navy-200 dark:before:bg-slate-700">
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
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-primary-600 dark:border-primary-500 flex items-center justify-center text-primary-700 dark:text-primary-400 shadow-xs z-10 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>

            {/* Timeline content card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-navy-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all space-y-2.5">
              {/* Header row with Registration No, Date, State, and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-navy-100 dark:border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-navy-950 dark:text-slate-200 px-2 py-0.5 bg-navy-50 dark:bg-slate-800 rounded-md border border-navy-200 dark:border-slate-700">
                    {item.consultation_id}
                  </span>
                  <span className="text-navy-300 dark:text-slate-600">•</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                    <span>{fullDateStr}</span>
                  </span>
                  {item.patient_state_name && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-300">
                      {item.patient_state_name}
                    </span>
                  )}
                  {(item.follow_up_date || item.follow_up_period) && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isFollowUpCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : isFollowUpOverdue
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : isFollowUpScheduled
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          : 'bg-navy-50 dark:bg-slate-800 text-navy-700 dark:text-slate-300 border-navy-200 dark:border-slate-700'
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
                      leftIcon={<FileText className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                      className="text-xs font-semibold text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800/80 bg-primary-50/50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/60"
                      title="View stored PDF prescription report"
                    >
                      View Report
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewReport(item.consultation_id)}
                      leftIcon={<Printer className="w-3.5 h-3.5 text-navy-500 dark:text-slate-400" />}
                      className="text-xs text-navy-600 dark:text-slate-300 hover:text-navy-950 dark:hover:text-white"
                      title="Generate PDF prescription report"
                    >
                      Generate Report
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditConsultation(item.consultation_id)}
                    leftIcon={<Edit3 className="w-3.5 h-3.5 text-navy-500 dark:text-slate-400" />}
                    className="text-xs text-navy-600 dark:text-slate-300 hover:text-navy-950 dark:hover:text-white"
                    title="Edit consultation"
                  >
                    Edit
                  </Button>

                  {item.has_report && onDownloadReport && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadReport(item)}
                      leftIcon={<Download className="w-3.5 h-3.5 text-navy-600 dark:text-slate-400" />}
                      className="text-xs text-navy-700 dark:text-slate-300 hover:text-navy-950 dark:hover:text-white border-navy-200 dark:border-slate-700 hover:bg-navy-50 dark:hover:bg-slate-800"
                      title="Download stored PDF report"
                    >
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>

              {/* Follow-Up Details if present */}
              {(item.follow_up_period || item.follow_up_date || item.follow_up_instructions) && (
                <div className="text-xs text-navy-600 dark:text-slate-300 flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="font-semibold text-navy-700 dark:text-slate-200 flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Follow-Up:</span>
                  </span>
                  {item.follow_up_period && (
                    <span className="font-medium text-navy-900 dark:text-slate-100">{item.follow_up_period}</span>
                  )}
                  {item.follow_up_date && (
                    <span className="text-navy-600 dark:text-slate-400">
                      ({new Date(item.follow_up_date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })})
                    </span>
                  )}
                  {item.follow_up_instructions && (
                    <span className="text-navy-500 dark:text-slate-400 italic line-clamp-1">
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
