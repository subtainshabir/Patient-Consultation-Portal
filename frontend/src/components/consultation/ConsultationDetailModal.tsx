import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Stethoscope,
  Activity,
  Brain,
  AlertCircle,
  User,
  Clock,
  FlaskConical,
  ClipboardCheck,
  Eye,
  HeartHandshake,
  Edit3,
  Calendar,
  Pill,
  CalendarClock,
  Phone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { consultationService } from '../../services/consultationService';

export interface ConsultationDetailModalProps {
  consultationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateConsultation?: (consultationId: string) => void;
  allConsultations?: { consultation_id: string; consultation_date?: string }[];
}

export const ConsultationDetailModal: React.FC<ConsultationDetailModalProps> = ({
  consultationId,
  isOpen,
  onClose,
  onNavigateConsultation,
  allConsultations = [],
}) => {
  const navigate = useNavigate();
  const { data: consultation, isLoading, error } = useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: () => consultationService.getConsultation(consultationId!),
    enabled: !!consultationId && isOpen,
  });

  if (!isOpen) return null;

  // Consultation navigation logic (newest to oldest index)
  const currentIndex = allConsultations.findIndex(
    (c) => c.consultation_id === consultationId
  );
  const hasOlder = currentIndex !== -1 && currentIndex < allConsultations.length - 1;
  const hasNewer = currentIndex !== -1 && currentIndex > 0;

  const handlePrevOlder = () => {
    if (hasOlder && onNavigateConsultation) {
      onNavigateConsultation(allConsultations[currentIndex + 1].consultation_id);
    }
  };

  const handleNextNewer = () => {
    if (hasNewer && onNavigateConsultation) {
      onNavigateConsultation(allConsultations[currentIndex - 1].consultation_id);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <DialogHeader
        title={consultation ? `Consultation ${consultation.consultation_id}` : 'Consultation Details'}
        description={
          consultation?.consultation_date
            ? new Date(consultation.consultation_date).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })
            : 'Clinical consultation details'
        }
        onClose={onClose}
      />

      <DialogContent className="max-h-[75vh] overflow-y-auto p-5 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-navy-500">
            <Clock className="w-8 h-8 animate-spin text-medical-600" />
            <p className="text-sm">Loading consultation details...</p>
          </div>
        ) : error || !consultation ? (
          <div className="py-8 text-center text-rose-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">Unable to load consultation details.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ─── 1. Patient Information (Section 4) ─── */}
            {consultation.patient && (
              <div className="p-4 rounded-xl bg-navy-50/80 border border-navy-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-medical-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-navy-950 text-sm">
                        {consultation.patient.full_name}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-white border border-navy-200 text-medical-800 font-bold">
                        {consultation.patient.patient_id}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-navy-600">
                      <span>{consultation.patient.age} yrs</span>
                      <span>•</span>
                      <span>{consultation.patient.gender}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-navy-400" />
                        {consultation.patient.mobile_number}
                      </span>
                      {consultation.patient.cnic && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[11px] text-navy-500">
                            CNIC: {consultation.patient.cnic}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {consultation.patient_state_name && (
                  <div className="self-start sm:self-auto">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-medical-200 text-medical-800 shadow-2xs">
                      State: {consultation.patient_state_name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ─── 2. Vital Signs (Section 4) ─── */}
            {consultation.vitals && (
              <div className="rounded-xl border border-navy-200 p-4 space-y-3 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-medical-600" />
                  <span>Vital Signs</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-navy-50/70 border border-navy-100">
                    <span className="text-navy-500 block text-[11px]">Blood Pressure</span>
                    <span className="font-mono font-bold text-navy-900 text-sm">
                      {consultation.vitals.systolic_bp && consultation.vitals.diastolic_bp
                        ? `${consultation.vitals.systolic_bp}/${consultation.vitals.diastolic_bp} mmHg`
                        : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-navy-50/70 border border-navy-100">
                    <span className="text-navy-500 block text-[11px]">Pulse Rate</span>
                    <span className="font-mono font-bold text-navy-900 text-sm">
                      {consultation.vitals.pulse_rate ? `${consultation.vitals.pulse_rate} bpm` : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-navy-50/70 border border-navy-100">
                    <span className="text-navy-500 block text-[11px]">Temperature</span>
                    <span className="font-mono font-bold text-navy-900 text-sm">
                      {consultation.vitals.temperature ? `${consultation.vitals.temperature} °C` : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-navy-50/70 border border-navy-100">
                    <span className="text-navy-500 block text-[11px]">Oxygen Saturation</span>
                    <span className="font-mono font-bold text-navy-900 text-sm">
                      {consultation.vitals.oxygen_saturation ? `${consultation.vitals.oxygen_saturation}%` : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-navy-50/70 border border-navy-100">
                    <span className="text-navy-500 block text-[11px]">NIHSS Score</span>
                    <span className="font-mono font-bold text-navy-900 text-sm">
                      {consultation.vitals.nihss_score !== null && consultation.vitals.nihss_score !== undefined
                        ? `${consultation.vitals.nihss_score} / 42`
                        : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-navy-50/70 border border-navy-100">
                    <span className="text-navy-500 block text-[11px]">Fall Risk</span>
                    <span className="font-semibold text-navy-900">
                      {consultation.vitals.fall_risk_status || '—'}
                    </span>
                  </div>
                </div>

                {consultation.vitals.fall_risk_notes && (
                  <p className="text-xs text-navy-600 bg-amber-50/50 p-2 rounded-lg border border-amber-200/50">
                    <strong>Fall Risk Notes:</strong> {consultation.vitals.fall_risk_notes}
                  </p>
                )}
              </div>
            )}

            {/* ─── 3. Symptoms (Section 4) ─── */}
            <div className="rounded-xl border border-navy-200 p-4 space-y-3 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-medical-600" />
                <span>Presenting Symptoms ({consultation.symptoms.length})</span>
              </h4>

              {consultation.symptoms.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {consultation.symptoms.map((s) => (
                    <span
                      key={s.id || s.symptom_name}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-medical-50 border border-medical-200 text-medical-900"
                    >
                      {s.symptom_name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-navy-500 italic">No symptoms recorded.</p>
              )}

              {consultation.symptom_notes && (
                <div className="pt-2 border-t border-navy-100">
                  <span className="text-[11px] font-semibold text-navy-500 block mb-1">
                    Symptom Clinical Notes:
                  </span>
                  <p className="text-xs text-navy-800 leading-relaxed whitespace-pre-wrap bg-navy-50/50 p-2.5 rounded-lg border border-navy-100">
                    {consultation.symptom_notes}
                  </p>
                </div>
              )}
            </div>

            {/* ─── 4. Neurological Examination (Section 4) ─── */}
            {consultation.examinations && consultation.examinations.length > 0 && (
              <div className="rounded-xl border border-navy-200 p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-medical-600" />
                    <span>Neurological Examination ({consultation.examinations.length} items recorded)</span>
                  </h4>
                  {consultation.power_text && (
                    <span className="text-xs font-semibold text-medical-800 bg-medical-50 px-2.5 py-0.5 rounded-md border border-medical-200">
                      Power: {consultation.power_text}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {consultation.examinations.map((exam, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-navy-100 bg-navy-50/40 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-navy-900">{exam.item_name}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                            exam.status === 'Done'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-navy-100 text-navy-600'
                          }`}
                        >
                          {exam.status}
                        </span>
                      </div>
                      {exam.finding && (
                        <p className="font-medium text-medical-800 mt-1">
                          Finding: {exam.finding}
                        </p>
                      )}
                      {exam.observation && (
                        <p className="text-navy-500 mt-0.5 text-[11px] italic">
                          Notes: {exam.observation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scores & Observations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-navy-200 p-4 space-y-2 bg-white text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 block">
                  Mental Status Scores
                </span>
                <div className="flex items-center gap-4 pt-1">
                  <div>
                    <span className="text-navy-500 block text-[11px]">MMSE Score</span>
                    <span className="text-base font-bold text-navy-900">
                      {consultation.mmse_score !== null && consultation.mmse_score !== undefined
                        ? `${consultation.mmse_score} / 30`
                        : 'Not tested'}
                    </span>
                  </div>
                  <div>
                    <span className="text-navy-500 block text-[11px]">GCS Score</span>
                    <span className="text-base font-bold text-navy-900">
                      {consultation.gcs_score !== null && consultation.gcs_score !== undefined
                        ? `${consultation.gcs_score} / 15`
                        : 'Not tested'}
                    </span>
                  </div>
                </div>
              </div>

              {consultation.additional_observations && (
                <div className="rounded-xl border border-navy-200 p-4 space-y-1.5 bg-white text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 block">
                    Additional Observations
                  </span>
                  <p className="text-xs text-navy-800 whitespace-pre-wrap leading-relaxed">
                    {consultation.additional_observations}
                  </p>
                </div>
              )}
            </div>

            {/* ─── 5. Diagnostic Tests (Section 4) ─── */}
            {consultation.diagnostic_tests && consultation.diagnostic_tests.length > 0 && (
              <div className="rounded-xl border border-navy-200 p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-medical-600" />
                    <span>Diagnostic Tests ({consultation.diagnostic_tests.length} tests)</span>
                  </h4>
                </div>

                <div className="space-y-2.5 text-xs">
                  {consultation.diagnostic_tests.map((test, idx) => {
                    const statusClass =
                      test.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : test.status === 'Reviewed'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : test.status === 'Pending'
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200';

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-navy-100 bg-navy-50/40 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy-900">{test.test_name}</span>
                            {test.category && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-navy-200 text-navy-600 font-medium">
                                {test.category}
                              </span>
                            )}
                          </div>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${statusClass}`}>
                            {test.status}
                          </span>
                        </div>

                        {test.clinical_indication && (
                          <div className="text-[11px] text-navy-700">
                            <span className="font-semibold text-navy-500">Indication: </span>
                            <span>{test.clinical_indication}</span>
                          </div>
                        )}

                        {test.result && (
                          <div className="text-[11px] text-navy-800 bg-white p-2 rounded-lg border border-navy-100">
                            <span className="font-semibold text-navy-500 block mb-0.5">Findings / Result:</span>
                            <p className="whitespace-pre-wrap">{test.result}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-navy-500 pt-1">
                          {test.result_date && (
                            <span className="flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-navy-400" />
                              Result Date: {new Date(test.result_date).toLocaleDateString()}
                            </span>
                          )}
                          {test.doctor_notes && (
                            <span className="italic">Note: {test.doctor_notes}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── 6. Clinical Assessment (Section 4) ─── */}
            {consultation.clinical_description && (
              <div className="rounded-xl border border-navy-200 p-4 space-y-1.5 bg-white text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-medical-600" />
                  <span>Clinical Assessment & Diagnostic Synthesis</span>
                </span>
                <p className="text-xs text-navy-800 whitespace-pre-wrap leading-relaxed bg-navy-50/50 p-3 rounded-lg border border-navy-100">
                  {consultation.clinical_description}
                </p>
              </div>
            )}

            {/* Additional Examination */}
            {consultation.additional_examination && (
              <div className="rounded-xl border border-navy-200 p-4 space-y-1.5 bg-white text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-medical-600" />
                  <span>Additional Examination Findings</span>
                </span>
                <p className="text-xs text-navy-800 whitespace-pre-wrap leading-relaxed bg-navy-50/50 p-3 rounded-lg border border-navy-100">
                  {consultation.additional_examination}
                </p>
              </div>
            )}

            {/* Treatment Plan */}
            {consultation.treatment_plan && (
              <div className="rounded-xl border border-navy-200 p-4 space-y-1.5 bg-white text-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-medical-600" />
                  <span>Treatment Plan & Care Instructions</span>
                </span>
                <p className="text-xs text-navy-800 whitespace-pre-wrap leading-relaxed bg-navy-50/50 p-3 rounded-lg border border-navy-100">
                  {consultation.treatment_plan}
                </p>
              </div>
            )}

            {/* ─── 7. Prescription (Section 4 & 15) ─── */}
            {consultation.prescriptions && consultation.prescriptions.length > 0 && (
              <div className="rounded-xl border border-navy-200 p-4 space-y-3 bg-white text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-medical-600" />
                    <span>Prescription ({consultation.prescriptions.length} {consultation.prescriptions.length === 1 ? 'Medicine' : 'Medicines'})</span>
                  </span>
                </div>

                <div className="space-y-2">
                  {consultation.prescriptions.map((med, idx) => (
                    <div
                      key={med.id || idx}
                      className="p-3 rounded-lg bg-navy-50/60 border border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-navy-950 font-mono">
                            {idx + 1}. {med.medicine_name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white border border-navy-200 text-navy-700 text-[11px] font-medium">
                            {med.dosage}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-navy-600">
                          <span className="font-semibold text-medical-800" dir="rtl">
                            {med.frequency_name}
                          </span>
                          <span className="text-navy-300">•</span>
                          <span>
                            Duration: <strong className="text-navy-900">{med.duration_days} days</strong>
                          </span>
                          {med.instruction_name && (
                            <>
                              <span className="text-navy-300">•</span>
                              <span className="text-navy-700" dir="rtl">
                                {med.instruction_name}
                              </span>
                            </>
                          )}
                          {med.custom_instruction && (
                            <>
                              <span className="text-navy-300">•</span>
                              <span className="italic text-navy-600">"{med.custom_instruction}"</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── 8. Follow-Up (Section 4, 7, 9, 10, 14) ─── */}
            {(consultation.follow_up_period || consultation.follow_up_date || consultation.follow_up_instructions) && (
              <div className="rounded-xl border border-navy-200 p-4 space-y-3 bg-white text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-medical-600" />
                    <span>Follow-Up Information</span>
                  </span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      consultation.follow_up_status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : consultation.follow_up_status === 'Overdue'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : consultation.follow_up_status === 'Scheduled'
                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                        : 'bg-navy-50 text-navy-700 border-navy-200'
                    }`}
                  >
                    {consultation.follow_up_status || 'Scheduled'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-navy-50/60 border border-navy-100">
                  <div>
                    <span className="text-[11px] text-navy-500 block">Follow-Up Period:</span>
                    <span className="font-bold text-navy-900 text-sm font-mono" dir="rtl">
                      {consultation.follow_up_period || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-navy-500 block">Target Follow-Up Date:</span>
                    <span className="font-semibold text-navy-900 text-sm">
                      {consultation.follow_up_date
                        ? new Date(consultation.follow_up_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'As needed / No exact date'}
                    </span>
                  </div>
                </div>

                {consultation.follow_up_instructions && (
                  <div className="p-3 rounded-lg bg-white border border-navy-200">
                    <span className="text-[11px] font-semibold text-navy-500 block mb-1">
                      Follow-Up Instructions:
                    </span>
                    <p className="text-navy-800 whitespace-pre-wrap leading-relaxed">
                      {consultation.follow_up_instructions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        {/* Navigation between consultations (Section 9 & 23) */}
        <div className="flex items-center gap-2">
          {hasOlder && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevOlder}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              className="text-xs"
              title="View previous older consultation"
            >
              Older
            </Button>
          )}
          {hasNewer && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextNewer}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              className="text-xs"
              title="View next newer consultation"
            >
              Newer
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-navy-500">
            Close
          </Button>
        </div>

        {consultation && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              const pId = consultation.patient?.patient_id || consultation.patient_id;
              navigate(`/patients/${pId}/consultation/${consultation.consultation_id}/edit`);
            }}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Edit Consultation
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
};
