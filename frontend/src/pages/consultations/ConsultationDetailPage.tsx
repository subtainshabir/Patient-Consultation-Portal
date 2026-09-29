import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit3,
  Stethoscope,
  Activity,
  Brain,
  AlertCircle,
  User,
  FlaskConical,
  ClipboardCheck,
  Calendar,
  Pill,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';

import { consultationService } from '../../services/consultationService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/LoadingSkeleton';
import { PrescriptionReportModal } from '../../components/consultation/PrescriptionReportModal';

export const ConsultationDetailPage: React.FC = () => {
  const { patientId, consultationId } = useParams<{
    patientId: string;
    consultationId: string;
  }>();
  const navigate = useNavigate();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // 1. Fetch full consultation details
  const {
    data: consultation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: () => consultationService.getConsultation(consultationId!),
    enabled: !!consultationId,
  });

  // 2. Fetch patient consultations for Prev/Next navigation
  const effectivePatientId = patientId || consultation?.patient?.patient_id;
  const { data: patientHistory = [] } = useQuery({
    queryKey: ['patient-consultations', effectivePatientId],
    queryFn: () => consultationService.getPatientConsultations(effectivePatientId!),
    enabled: !!effectivePatientId,
  });

  // Navigation logic
  const currentIndex = patientHistory.findIndex(
    (c) => c.consultation_id === consultationId
  );
  const hasOlder = currentIndex !== -1 && currentIndex < patientHistory.length - 1;
  const hasNewer = currentIndex !== -1 && currentIndex > 0;

  const olderConsultationId = hasOlder ? patientHistory[currentIndex + 1].consultation_id : null;
  const newerConsultationId = hasNewer ? patientHistory[currentIndex - 1].consultation_id : null;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse p-4">
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (error || !consultation) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-4">
        <Card className="p-8">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-950 mb-2">Consultation Not Found</h2>
          <p className="text-sm text-navy-600 mb-6">
            The requested consultation record could not be loaded or does not exist.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(patientId ? `/patients/${patientId}` : '/patients')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Patient Profile
          </Button>
        </Card>
      </div>
    );
  }

  const patientObj = consultation.patient;
  const pId = patientObj?.patient_id || patientId;
  const formattedDate = new Date(consultation.consultation_date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* ─── Breadcrumbs & Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link
            to={`/patients/${pId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-medical-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Patient Profile</span>
          </Link>
          <span className="text-navy-300">/</span>
          <span className="font-mono text-xs font-bold text-navy-900">
            {consultation.consultation_id}
          </span>
        </div>

        {/* Top Actions: Prev/Next & Edit & New Consultation */}
        <div className="flex flex-wrap items-center gap-2">
          {olderConsultationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/patients/${pId}/consultation/${olderConsultationId}`)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Older
            </Button>
          )}

          {newerConsultationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/patients/${pId}/consultation/${newerConsultationId}`)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Newer
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<FileText className="w-3.5 h-3.5 text-medical-600" />}
            className="text-xs font-semibold text-medical-800 border-medical-200 bg-medical-50/50 hover:bg-medical-100"
            id="preview-report-btn"
          >
            Preview Report
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/patients/${pId}/consultation/new`)}
            leftIcon={<Stethoscope className="w-3.5 h-3.5 text-medical-600" />}
            className="text-xs"
          >
            + New Consultation
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              navigate(`/patients/${pId}/consultation/${consultation.consultation_id}/edit`)
            }
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Edit Consultation
          </Button>
        </div>
      </div>

      {/* ─── 1. Header Banner & Consultation Info (Section 4) ─── */}
      <Card className="border-navy-200 shadow-sm bg-gradient-to-r from-white via-white to-navy-50/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-medical-50 text-medical-900 border border-medical-200">
                  {consultation.consultation_id}
                </span>
                <span className="text-navy-300">•</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-800">
                  <Calendar className="w-3.5 h-3.5 text-medical-600" />
                  {formattedDate}
                </span>
                {consultation.patient_state_name && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    State: {consultation.patient_state_name}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-navy-950">
                Clinical Consultation Record
              </h1>
            </div>

            {/* Read-Only Status Indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-navy-100 text-navy-700 border border-navy-200">
                Read-Only Record
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 2. Patient Information (Section 4) ─── */}
      {patientObj && (
        <Card className="border-navy-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-navy-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-medical-600" />
              <span>Patient Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
              <div>
                <span className="text-navy-400 block text-[11px] font-semibold uppercase">Patient ID</span>
                <span className="font-mono font-bold text-navy-900 text-sm">{patientObj.patient_id}</span>
              </div>
              <div>
                <span className="text-navy-400 block text-[11px] font-semibold uppercase">Full Name</span>
                <span className="font-semibold text-navy-900 text-sm">{patientObj.full_name}</span>
              </div>
              <div>
                <span className="text-navy-400 block text-[11px] font-semibold uppercase">Age</span>
                <span className="font-semibold text-navy-900 text-sm">{patientObj.age} years</span>
              </div>
              <div>
                <span className="text-navy-400 block text-[11px] font-semibold uppercase">Gender</span>
                <span className="font-semibold text-navy-900 text-sm">{patientObj.gender}</span>
              </div>
              <div>
                <span className="text-navy-400 block text-[11px] font-semibold uppercase">Mobile</span>
                <span className="font-mono font-semibold text-navy-900 text-sm">{patientObj.mobile_number}</span>
              </div>
              <div>
                <span className="text-navy-400 block text-[11px] font-semibold uppercase">CNIC</span>
                <span className="font-mono font-semibold text-navy-900 text-sm">{patientObj.cnic || '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 3. Vital Signs (Section 4) ─── */}
      {consultation.vitals && (
        <Card className="border-navy-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-navy-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-medical-600" />
              <span>Vital Signs & Clinical Measurements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-navy-50/70 border border-navy-100">
                <span className="text-navy-500 block text-[11px]">Blood Pressure</span>
                <span className="font-mono font-bold text-navy-900 text-sm">
                  {consultation.vitals.systolic_bp && consultation.vitals.diastolic_bp
                    ? `${consultation.vitals.systolic_bp} / ${consultation.vitals.diastolic_bp} mmHg`
                    : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-50/70 border border-navy-100">
                <span className="text-navy-500 block text-[11px]">Pulse Rate</span>
                <span className="font-mono font-bold text-navy-900 text-sm">
                  {consultation.vitals.pulse_rate ? `${consultation.vitals.pulse_rate} bpm` : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-50/70 border border-navy-100">
                <span className="text-navy-500 block text-[11px]">Temperature</span>
                <span className="font-mono font-bold text-navy-900 text-sm">
                  {consultation.vitals.temperature ? `${consultation.vitals.temperature} °C` : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-50/70 border border-navy-100">
                <span className="text-navy-500 block text-[11px]">Oxygen Saturation</span>
                <span className="font-mono font-bold text-navy-900 text-sm">
                  {consultation.vitals.oxygen_saturation ? `${consultation.vitals.oxygen_saturation}%` : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-50/70 border border-navy-100">
                <span className="text-navy-500 block text-[11px]">NIHSS Score</span>
                <span className="font-mono font-bold text-navy-900 text-sm">
                  {consultation.vitals.nihss_score !== null && consultation.vitals.nihss_score !== undefined
                    ? `${consultation.vitals.nihss_score} / 42`
                    : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-navy-50/70 border border-navy-100">
                <span className="text-navy-500 block text-[11px]">Fall Risk</span>
                <span className="font-semibold text-navy-900 text-sm">
                  {consultation.vitals.fall_risk_status || '—'}
                </span>
              </div>
            </div>

            {consultation.vitals.fall_risk_notes && (
              <p className="text-xs text-navy-600 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                <strong>Fall Risk Notes:</strong> {consultation.vitals.fall_risk_notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── 4. Symptoms (Section 4 & 17) ─── */}
      <Card className="border-navy-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-navy-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-medical-600" />
            <span>Presenting Symptoms ({consultation.symptoms.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {consultation.symptoms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {consultation.symptoms.map((s) => (
                <span
                  key={s.id || s.symptom_name}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-medical-50 border border-medical-200 text-medical-900"
                >
                  {s.symptom_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-navy-500 italic">No symptoms recorded.</p>
          )}

          {consultation.symptom_notes && (
            <div className="pt-3 border-t border-navy-100">
              <span className="text-xs font-semibold text-navy-600 block mb-1">
                Symptom Clinical Notes:
              </span>
              <p className="text-xs text-navy-800 whitespace-pre-wrap leading-relaxed bg-navy-50/50 p-3 rounded-xl border border-navy-100">
                {consultation.symptom_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 5. Neurological Examination (Section 4 & 17) ─── */}
      {consultation.examinations && consultation.examinations.length > 0 && (
        <Card className="border-navy-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Brain className="w-4 h-4 text-medical-600" />
              <span>Neurological Examination ({consultation.examinations.length} items recorded)</span>
            </CardTitle>
            {consultation.power_text && (
              <span className="text-xs font-semibold text-medical-800 bg-medical-50 px-2.5 py-1 rounded-md border border-medical-200">
                Power: {consultation.power_text}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {consultation.examinations.map((exam, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-navy-100 bg-navy-50/40 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-navy-950">{exam.item_name}</span>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        exam.status === 'Done'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-navy-100 text-navy-600'
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>
                  {exam.finding && (
                    <p className="font-medium text-medical-800 mt-1.5">
                      Finding: {exam.finding}
                    </p>
                  )}
                  {exam.observation && (
                    <p className="text-navy-500 mt-1 text-[11px] italic">
                      Notes: {exam.observation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mental Status Scores & Observations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-navy-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-navy-100">
            <CardTitle className="text-sm font-bold">Mental Status Scores</CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex items-center gap-6">
            <div>
              <span className="text-navy-500 block text-xs">MMSE Score</span>
              <span className="text-lg font-bold text-navy-900">
                {consultation.mmse_score !== null && consultation.mmse_score !== undefined
                  ? `${consultation.mmse_score} / 30`
                  : 'Not tested'}
              </span>
            </div>
            <div>
              <span className="text-navy-500 block text-xs">GCS Score</span>
              <span className="text-lg font-bold text-navy-900">
                {consultation.gcs_score !== null && consultation.gcs_score !== undefined
                  ? `${consultation.gcs_score} / 15`
                  : 'Not tested'}
              </span>
            </div>
          </CardContent>
        </Card>

        {consultation.additional_observations && (
          <Card className="border-navy-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-navy-100">
              <CardTitle className="text-sm font-bold">Additional Observations</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-xs text-navy-800 whitespace-pre-wrap leading-relaxed">
                {consultation.additional_observations}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ─── 6. Diagnostic Tests (Section 4 & 16) ─── */}
      {consultation.diagnostic_tests && consultation.diagnostic_tests.length > 0 && (
        <Card className="border-navy-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-navy-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-medical-600" />
              <span>Diagnostic Tests ({consultation.diagnostic_tests.length} tests)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
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
                <div key={idx} className="p-4 rounded-xl border border-navy-100 bg-navy-50/40 space-y-2 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-950 text-sm">{test.test_name}</span>
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
                    <div className="text-xs text-navy-700">
                      <span className="font-semibold text-navy-500">Clinical Indication: </span>
                      <span>{test.clinical_indication}</span>
                    </div>
                  )}

                  {test.result && (
                    <div className="text-xs text-navy-900 bg-white p-3 rounded-lg border border-navy-200">
                      <span className="font-semibold text-navy-500 block mb-1">Result & Findings:</span>
                      <p className="whitespace-pre-wrap leading-relaxed">{test.result}</p>
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
          </CardContent>
        </Card>
      )}

      {/* ─── 7. Clinical Assessment (Section 4) ─── */}
      <Card className="border-navy-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-navy-100">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-medical-600" />
            <span>Clinical Assessment & Treatment Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-xs">
          {consultation.clinical_description && (
            <div>
              <span className="font-bold text-navy-900 block mb-1">
                Clinical Assessment & Impression
              </span>
              <p className="text-navy-800 whitespace-pre-wrap leading-relaxed bg-navy-50/50 p-3 rounded-xl border border-navy-100">
                {consultation.clinical_description}
              </p>
            </div>
          )}

          {consultation.additional_examination && (
            <div>
              <span className="font-bold text-navy-900 block mb-1">
                Additional Examination Findings
              </span>
              <p className="text-navy-800 whitespace-pre-wrap leading-relaxed bg-navy-50/50 p-3 rounded-xl border border-navy-100">
                {consultation.additional_examination}
              </p>
            </div>
          )}

          {consultation.treatment_plan && (
            <div>
              <span className="font-bold text-navy-900 block mb-1">
                Treatment Plan & Care Instructions
              </span>
              <p className="text-navy-800 whitespace-pre-wrap leading-relaxed bg-navy-50/50 p-3 rounded-xl border border-navy-100">
                {consultation.treatment_plan}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 8. Prescription (Section 4 & 15) ─── */}
      {consultation.prescriptions && consultation.prescriptions.length > 0 && (
        <Card className="border-navy-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-navy-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Pill className="w-4 h-4 text-medical-600" />
              <span>Prescription ({consultation.prescriptions.length} {consultation.prescriptions.length === 1 ? 'Medicine' : 'Medicines'})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {consultation.prescriptions.map((med, idx) => (
              <div
                key={med.id || idx}
                className="p-3.5 rounded-xl bg-navy-50/60 border border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy-950 text-sm font-mono">
                      {idx + 1}. {med.medicine_name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white border border-navy-200 text-navy-700 text-xs font-medium">
                      {med.dosage}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-navy-600 text-xs">
                    <span className="font-semibold text-medical-800 text-sm" dir="rtl">
                      {med.frequency_name}
                    </span>
                    <span className="text-navy-300">•</span>
                    <span>Duration: <strong>{med.duration_days} days</strong></span>
                    {med.instruction_name && (
                      <>
                        <span className="text-navy-300">•</span>
                        <span className="text-navy-700 font-medium" dir="rtl">
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
          </CardContent>
        </Card>
      )}

      {/* ─── 9. Follow-Up (Section 4, 7, 9, 10, 14) ─── */}
      {(consultation.follow_up_period || consultation.follow_up_date || consultation.follow_up_instructions) && (
        <Card className="border-navy-200 shadow-sm">
          <CardHeader className="pb-3 border-b border-navy-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-medical-600" />
              <span>Follow-Up Information</span>
            </CardTitle>
            <span
              className={`text-xs px-3 py-1 rounded-full font-semibold border ${
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
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-navy-50/70 border border-navy-100">
              <div>
                <span className="text-navy-500 block text-xs">Follow-Up Period</span>
                <span className="font-bold text-navy-950 text-base font-mono" dir="rtl">
                  {consultation.follow_up_period || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-navy-500 block text-xs">Target Date</span>
                <span className="font-bold text-navy-950 text-base">
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
              <div className="p-4 rounded-xl bg-white border border-navy-200">
                <span className="text-xs font-semibold text-navy-600 block mb-1">
                  Follow-Up Instructions:
                </span>
                <p className="text-navy-800 whitespace-pre-wrap leading-relaxed">
                  {consultation.follow_up_instructions}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bottom Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-navy-200">
        <Button
          variant="outline"
          onClick={() => navigate(`/patients/${pId}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Patient Profile
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<FileText className="w-4 h-4 text-medical-600" />}
            className="text-medical-800 border-medical-200 bg-medical-50/50 hover:bg-medical-100"
          >
            Preview Report
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(`/patients/${pId}/consultation/new`)}
            leftIcon={<Stethoscope className="w-4 h-4 text-medical-600" />}
          >
            + New Consultation
          </Button>

          <Button
            variant="primary"
            onClick={() =>
              navigate(`/patients/${pId}/consultation/${consultation.consultation_id}/edit`)
            }
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            Edit Consultation
          </Button>
        </div>
      </div>

      {/* ─── Prescription Report Modal (Phase 8) ─── */}
      <PrescriptionReportModal
        consultationId={consultation.consultation_id}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
