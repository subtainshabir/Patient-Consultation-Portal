import React, { useMemo, useState } from 'react';
import {
  History,
  Calendar,
  Clock,
  ChevronRight,
  Activity,
  Pill,
  FlaskConical,
  CalendarClock,
  Search,
} from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  // Filter consultations
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return consultations;
    const term = searchTerm.toLowerCase().trim();
    return consultations.filter(
      (c) =>
        c.consultation_id.toLowerCase().includes(term) ||
        (c.patient_state_name && c.patient_state_name.toLowerCase().includes(term)) ||
        (c.symptoms_summary && c.symptoms_summary.some((s) => s.toLowerCase().includes(term))) ||
        (c.follow_up_period && c.follow_up_period.toLowerCase().includes(term))
    );
  }, [consultations, searchTerm]);

  // Group consultations by date (Section 7)
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: ConsultationSummary[] } = {};
    filtered.forEach((item) => {
      const dateObj = new Date(item.consultation_date);
      const dateKey = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  }, [filtered]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <DialogHeader
        title="Medical History"
        description={`Previous clinical consultations for ${patientName}`}
        onClose={onClose}
      />
      <DialogContent className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-4">
        {/* Search bar inside history */}
        {consultations.length > 2 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              placeholder="Search past consultations by ID, symptoms, state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs text-navy-900 bg-navy-50/60 border border-navy-200 rounded-lg focus:outline-hidden focus:border-medical-500 focus:bg-white transition-colors"
            />
          </div>
        )}

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
        ) : Object.keys(groupedByDate).length === 0 ? (
          <div className="py-8 text-center text-navy-500 space-y-2">
            <p className="text-xs">No consultations matching "{searchTerm}"</p>
            <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>
              Clear search
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-navy-500 font-medium px-1">
              Found {filtered.length} {filtered.length === 1 ? 'consultation record' : 'consultation records'} grouped by date:
            </p>

            {/* Date-grouped list (Section 7) */}
            <div className="space-y-4">
              {Object.entries(groupedByDate).map(([dateLabel, items]) => (
                <div key={dateLabel} className="space-y-1.5">
                  {/* Date Header Badge */}
                  <div className="flex items-center gap-2 px-1">
                    <Calendar className="w-3.5 h-3.5 text-medical-600" />
                    <span className="font-bold text-xs text-navy-950 uppercase tracking-wide">
                      {dateLabel}
                    </span>
                    <span className="text-[11px] text-navy-400">
                      ({items.length} {items.length === 1 ? 'visit' : 'visits'})
                    </span>
                  </div>

                  {/* Consultations under this date */}
                  <div className="divide-y divide-navy-100 rounded-xl border border-navy-200 overflow-hidden bg-white shadow-2xs">
                    {items.map((item) => (
                      <div
                        key={item.consultation_id}
                        onClick={() => {
                          onSelectConsultation(item.consultation_id);
                        }}
                        className="p-3.5 hover:bg-navy-50/80 cursor-pointer transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-navy-900 group-hover:text-medical-800 transition-colors">
                              {item.consultation_id}
                            </span>
                            {item.patient_state_name && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy-100 text-navy-700">
                                {item.patient_state_name}
                              </span>
                            )}
                            {item.follow_up_status && item.follow_up_status !== 'No Follow-Up' && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                                Follow-Up: {item.follow_up_status}
                              </span>
                            )}
                          </div>

                          {/* Symptoms list if available */}
                          {item.symptoms_summary && item.symptoms_summary.length > 0 && (
                            <div className="text-[11px] text-amber-900 line-clamp-1">
                              <strong>Symptoms:</strong> {item.symptoms_summary.join(', ')}
                            </div>
                          )}

                          {/* Key Indicators Preview */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-500 pt-0.5">
                            {item.bp_formatted && (
                              <span className="inline-flex items-center gap-1 font-mono text-navy-700 text-[11px]">
                                <Activity className="w-3 h-3 text-medical-600" />
                                {item.bp_formatted}
                              </span>
                            )}
                            {item.pulse_rate && <span className="text-[11px]">{item.pulse_rate} bpm</span>}
                            {item.diagnostic_test_count !== undefined && item.diagnostic_test_count > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-navy-700">
                                <FlaskConical className="w-3 h-3 text-indigo-600" />
                                {item.diagnostic_test_count} {item.diagnostic_test_count === 1 ? 'test' : 'tests'}
                              </span>
                            )}
                            {item.prescription_count !== undefined && item.prescription_count > 0 && (
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded text-[11px]">
                                <Pill className="w-3 h-3 text-emerald-600" />
                                {item.prescription_count} {item.prescription_count === 1 ? 'med' : 'meds'}
                              </span>
                            )}
                            {item.follow_up_period && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-sky-800">
                                <CalendarClock className="w-3 h-3 text-sky-600" />
                                {item.follow_up_period}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-semibold text-medical-700 group-hover:translate-x-0.5 transition-transform shrink-0">
                          <span>View Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
