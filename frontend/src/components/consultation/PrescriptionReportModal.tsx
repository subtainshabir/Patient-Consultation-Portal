import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Printer,
  RefreshCw,
  X,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { consultationService } from '../../services/consultationService';
import type { Consultation, ConsultationReport } from '../../types/consultation';
import { cn } from '../../utils/cn';

export interface PrescriptionReportModalProps {
  consultationId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrescriptionReportModal: React.FC<PrescriptionReportModalProps> = ({
  consultationId,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'document' | 'pdf'>('document');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch consultation full details
  const {
    data: consultation,
    isLoading: isConsultationLoading,
    error: consultationError,
  } = useQuery<Consultation>({
    queryKey: ['consultation', consultationId],
    queryFn: () => consultationService.getConsultation(consultationId!),
    enabled: !!consultationId && isOpen,
  });

  // 2. Fetch or initialize report metadata
  const {
    data: report,
    isLoading: isReportLoading,
    refetch: refetchReport,
  } = useQuery<ConsultationReport>({
    queryKey: ['consultation-report-meta', consultationId],
    queryFn: () => consultationService.getReportMetadata(consultationId!),
    enabled: !!consultationId && isOpen,
  });

  // 3. Load PDF blob when PDF view is activated or report is ready
  useEffect(() => {
    let active = true;
    let urlToRevoke: string | null = null;

    if (isOpen && consultationId && (viewMode === 'pdf' || report)) {
      consultationService
        .getReportPdfBlob(consultationId, report?.version)
        .then((blob) => {
          if (!active) return;
          const url = URL.createObjectURL(blob);
          urlToRevoke = url;
          setPdfBlobUrl(url);
        })
        .catch((err) => {
          console.error('Failed to load PDF blob:', err);
        });
    }

    return () => {
      active = false;
      if (urlToRevoke) {
        URL.revokeObjectURL(urlToRevoke);
      }
    };
  }, [isOpen, consultationId, report?.version, viewMode]);

  // Manage body class for print styling isolation
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('prescription-report-modal-open');
      return () => {
        document.body.classList.remove('prescription-report-modal-open');
      };
    }
  }, [isOpen]);

  // 4. Force Regenerate Mutation
  const regenerateMutation = useMutation({
    mutationFn: () => consultationService.generateReport(consultationId!, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultation', consultationId] });
      queryClient.invalidateQueries({ queryKey: ['consultation-report-meta', consultationId] });
      queryClient.invalidateQueries({ queryKey: ['patient-consultations'] });
      refetchReport();
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to regenerate report');
    },
  });

  // 5. Download handler
  const handleDownload = async () => {
    if (!consultationId) return;
    setIsDownloading(true);
    setErrorMessage(null);
    try {
      const fileName = report?.file_name || `Prescription_${consultation?.patient?.patient_id || 'PATIENT'}.pdf`;
      await consultationService.downloadReportPdf(consultationId, fileName, report?.version);
    } catch (err: any) {
      setErrorMessage(err.message || 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  // 6. Print handler
  const handlePrint = () => {
    const triggerPrint = () => {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'visible';
      window.print();
      setTimeout(() => {
        document.body.style.overflow = prevOverflow;
      }, 500);
    };

    if (viewMode === 'pdf') {
      setViewMode('document');
      setTimeout(triggerPrint, 150);
    } else {
      triggerPrint();
    }
  };

  if (!isOpen) return null;

  const isLoading = isConsultationLoading || isReportLoading;
  const patient = consultation?.patient;
  const vitals = consultation?.vitals;
  const formattedDate = consultation?.consultation_date
    ? new Date(consultation.consultation_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '—';
  const formattedTime = consultation?.consultation_date
    ? new Date(consultation.consultation_date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
    : '—';

  // Check if sections have meaningful data (Strict Dynamic Visibility)
  const hasSymptoms = Boolean(consultation?.symptoms && consultation.symptoms.length > 0) || Boolean(consultation?.symptom_notes?.trim());
  const hasVitals = Boolean(
    vitals && (
      vitals.systolic_bp !== null ||
      vitals.pulse_rate !== null ||
      vitals.temperature !== null ||
      vitals.oxygen_saturation !== null ||
      vitals.nihss_score !== null ||
      vitals.fall_risk_status
    )
  );
  const hasExam = Boolean(
    (consultation?.examinations && consultation.examinations.length > 0) ||
    consultation?.power_text?.trim() ||
    consultation?.mmse_score !== null ||
    consultation?.gcs_score !== null ||
    consultation?.additional_observations?.trim()
  );
  const hasDiagnosticTests = Boolean(consultation?.diagnostic_tests && consultation.diagnostic_tests.length > 0);
  const hasClinicalInfo = Boolean(
    consultation?.clinical_description?.trim() ||
    consultation?.additional_examination?.trim() ||
    consultation?.treatment_plan?.trim()
  );
  const hasPrescription = Boolean(consultation?.prescriptions && consultation.prescriptions.length > 0);
  const hasFollowUp = Boolean(
    consultation?.follow_up_date ||
    consultation?.follow_up_period?.trim() ||
    consultation?.follow_up_instructions?.trim()
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} maxWidth="4xl" className="overflow-hidden max-h-[92vh] flex flex-col">
      {/* ─── MODAL CONTROLS HEADER (Hidden on print) ─── */}
      <div className="no-print p-4 sm:px-6 border-b border-navy-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-navy-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-navy-950">Prescription Report</h2>
              {report && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy-100 text-navy-800 border border-navy-200">
                  Version {report.version}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Persistent Storage
              </span>
            </div>
            <p className="text-xs text-navy-500 font-mono">
              {consultationId} • {formattedDate}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="inline-flex p-0.5 bg-navy-100 rounded-lg border border-navy-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('document')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                viewMode === 'document' ? 'bg-white text-navy-950 shadow-2xs' : 'text-navy-600 hover:text-navy-950'
              )}
            >
              Document
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pdf')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all',
                viewMode === 'pdf' ? 'bg-white text-navy-950 shadow-2xs' : 'text-navy-600 hover:text-navy-950'
              )}
            >
              PDF File
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', regenerateMutation.isPending && 'animate-spin')} />}
            className="text-xs"
            title="Re-generate report version if consultation data updated"
          >
            {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5 text-navy-600" />}
            className="text-xs"
            id="report-print-btn"
          >
            Print
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
            id="report-download-btn"
          >
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-navy-400 hover:text-navy-700 hover:bg-navy-100 p-1.5 rounded-lg transition-colors ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="no-print mx-4 sm:mx-6 mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            {errorMessage}
          </span>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── MODAL BODY: A4 DOCUMENT PREVIEW OR PDF VIEWER ─── */}
      <div className="modal-scroll-body flex-1 overflow-y-auto p-4 sm:p-6 bg-navy-100/60 flex justify-center">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-navy-500">
            <Clock className="w-8 h-8 animate-spin text-medical-600" />
            <p className="text-sm font-medium">Generating prescription report...</p>
          </div>
        ) : consultationError || !consultation ? (
          <div className="py-16 text-center text-rose-600 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">Failed to load consultation report.</p>
          </div>
        ) : viewMode === 'pdf' && pdfBlobUrl ? (
          /* PDF Viewer Mode */
          <div className="w-full h-[70vh] bg-white rounded-xl shadow-lg border border-navy-200 overflow-hidden flex flex-col">
            <iframe
              src={pdfBlobUrl}
              title={`Prescription-${consultation.consultation_id}`}
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          /* Responsive A4 Document View (matching Reference Image) */
          <div className="printable-report report-container w-full max-w-[800px] bg-white rounded-xl shadow-xl border border-navy-200/80 p-6 sm:p-8 space-y-4 text-navy-950 font-sans">

            {/* ─── DOCTOR / CLINIC HEADER (Section 7) ─── */}
            <div className="clinic-header flex flex-col sm:flex-row justify-between items-start pb-3 border-b-2 border-navy-900 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#1B365D] tracking-tight">
                    Dr. Rauf Neurology Clinic
                  </h1>
                  <span className="text-sm font-bold text-[#1B365D] font-serif" dir="rtl">
                  </span>
                </div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-navy-500">
                  Neurology & Brain Care Center
                </p>
                <div className="pt-1 text-xs">
                  <p className="font-bold text-navy-900">
                    Dr. Abdul Rauf{' '}
                    <span className="font-serif font-semibold text-navy-700" dir="rtl">
                    </span>
                  </p>
                  <p className="text-navy-600 text-[11px]">
                    Consultant Neurologist • MBBS, FCPS (Neurology) • PMC 45892-P
                  </p>
                </div>
              </div>

              <div className="text-xs text-navy-600 space-y-1 sm:text-right shrink-0">
                <p className="flex items-center sm:justify-end gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-[#1B365D]" />
                  <span>0300-1234567</span>
                </p>
                <p className="flex items-center sm:justify-end gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-[#1B365D]" />
                  <span>drrauf.clinic@gmail.com</span>
                </p>
                <p className="flex items-center sm:justify-end gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#1B365D]" />
                  <span>Lahore, Pakistan</span>
                </p>
              </div>
            </div>

            {/* ─── PRESCRIPTION REPORT TITLE (Section 9) ─── */}
            <div className="text-center py-1">
              <h2 className="text-base sm:text-lg font-black text-[#1B365D] tracking-tight flex items-center justify-center gap-2">
                <span>PRESCRIPTION REPORT</span>
                <span className="text-navy-400">/</span>
                <span className="font-serif text-[#1B365D]" dir="rtl">
                  نسخہ رپورٹ
                </span>
              </h2>
            </div>

            {/* ─── DOCTOR & PATIENT INFORMATION (Section 10) ─── */}
            <div className="patient-info-table rounded-lg border border-navy-300 bg-navy-50/40 overflow-hidden text-xs">
              <div className="section-banner bg-[#1B365D] text-white px-3 py-1 font-bold text-[11px] tracking-wide">
                DOCTOR & PATIENT INFORMATION
              </div>
              <div className="divide-y divide-navy-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 p-2.5 gap-2">
                  <div>
                    <span className="font-bold text-navy-900">Doctor:</span>{' '}
                    <span className="text-navy-800 font-medium">Dr. Abdul Rauf (PMC 45892-P)</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="font-bold text-navy-900">Date:</span>{' '}
                    <span className="text-navy-800 font-medium">{formattedDate}</span>
                    <span className="mx-2 text-navy-300">|</span>
                    <span className="font-bold text-navy-900">Time:</span>{' '}
                    <span className="text-navy-800 font-medium">{formattedTime}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 p-2.5 gap-2 bg-white">
                  <div>
                    <span className="font-bold text-navy-900">Patient Name:</span>{' '}
                    <span className="text-navy-950 font-bold">{patient?.full_name || '—'}</span>
                  </div>
                  <div className="sm:text-right font-mono">
                    <span className="font-bold text-navy-900 font-sans">Patient ID:</span>{' '}
                    <span className="font-bold text-navy-900">{patient?.patient_id || consultation.patient_id}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 p-2.5 gap-2 text-[11px]">
                  <div>
                    <span className="font-bold text-navy-900">Age:</span>{' '}
                    <span>{patient?.age ? `${patient.age} Yrs` : '—'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-navy-900">Gender:</span>{' '}
                    <span>{patient?.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-navy-900">Mobile:</span>{' '}
                    <span>{patient?.mobile_number || '—'}</span>
                  </div>
                  {patient?.cnic ? (
                    <div>
                      <span className="font-bold text-navy-900">CNIC:</span>{' '}
                      <span className="font-mono">{patient.cnic}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-bold text-navy-900">Consultation ID:</span>{' '}
                      <span className="font-mono">{consultation.consultation_id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ─── SYMPTOMS (Section 11 — Only if populated) ─── */}
            {hasSymptoms && (
              <div className="report-section page-break-inside-avoid rounded-lg border border-navy-300 bg-white overflow-hidden text-xs">
                <div className="section-banner bg-[#1B365D] text-white px-3 py-1 font-bold text-[11px] tracking-wide flex justify-between items-center">
                  <span>SYMPTOMS</span>
                  <span className="font-serif font-medium" dir="rtl">
                    علامات
                  </span>
                </div>
                <div className="p-3 space-y-2 bg-navy-50/30">
                  {consultation.symptoms && consultation.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {consultation.symptoms.map((s, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-navy-200 text-xs text-navy-900 font-medium"
                        >
                          • {s.symptom_name}
                          {s.category && s.category !== 'General' && ` (${s.category})`}
                          {s.notes && ` — ${s.notes}`}
                        </span>
                      ))}
                    </div>
                  )}
                  {consultation.symptom_notes && (
                    <p className="text-xs text-navy-700 italic border-t border-navy-100 pt-1.5">
                      <strong className="text-navy-900 not-italic">Clinical Observation:</strong>{' '}
                      {consultation.symptom_notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ─── VITAL SIGNS (Section 12 — Only if populated) ─── */}
            {hasVitals && vitals && (
              <div className="report-section page-break-inside-avoid rounded-lg border border-navy-300 bg-white overflow-hidden text-xs">
                <div className="section-banner bg-[#1B365D] text-white px-3 py-1 font-bold text-[11px] tracking-wide flex justify-between items-center">
                  <span>VITALS</span>
                  <span className="font-serif font-medium" dir="rtl">
                    وائٹل سائنز
                  </span>
                </div>
                <div className="p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-navy-50/30 font-medium">
                  {vitals.systolic_bp !== null && vitals.diastolic_bp !== null && (
                    <div>
                      <span className="font-bold text-navy-900">BP:</span>{' '}
                      <span className="font-mono">{vitals.systolic_bp}/{vitals.diastolic_bp} mmHg</span>
                    </div>
                  )}
                  {vitals.pulse_rate !== null && (
                    <div>
                      <span className="font-bold text-navy-900">Pulse:</span> {vitals.pulse_rate} bpm
                    </div>
                  )}
                  {vitals.temperature !== null && (
                    <div>
                      <span className="font-bold text-navy-900">Temp:</span> {vitals.temperature} °C
                    </div>
                  )}
                  {vitals.oxygen_saturation !== null && (
                    <div>
                      <span className="font-bold text-navy-900">SpO2:</span> {vitals.oxygen_saturation}%
                    </div>
                  )}
                  {vitals.nihss_score !== null && (
                    <div>
                      <span className="font-bold text-navy-900">NIHSS Score:</span> {vitals.nihss_score}
                    </div>
                  )}
                  {vitals.fall_risk_status && (
                    <div>
                      <span className="font-bold text-navy-900">Fall Risk:</span> {vitals.fall_risk_status}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── NEUROLOGICAL EXAMINATION (Section 13 & 14 — Only if populated) ─── */}
            {hasExam && (
              <div className="report-section page-break-inside-avoid rounded-lg border border-navy-300 bg-white overflow-hidden text-xs">
                <div className="section-banner bg-[#1B365D] text-white px-3 py-1 font-bold text-[11px] tracking-wide flex justify-between items-center">
                  <span>NEUROLOGICAL EXAMINATION</span>
                  <span className="font-serif font-medium" dir="rtl">
                    اعصابی معائنہ
                  </span>
                </div>
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-navy-50/30">
                  {consultation.examinations?.map((ex, idx) => (
                    <div key={idx} className="flex justify-between border-b border-navy-100/80 pb-1">
                      <span className="font-semibold text-navy-900">{ex.category} - {ex.item_name}:</span>
                      <span className="text-navy-800">{ex.finding || 'Done'} {ex.observation && `(${ex.observation})`}</span>
                    </div>
                  ))}
                  {consultation.power_text && (
                    <div className="flex justify-between border-b border-navy-100/80 pb-1">
                      <span className="font-semibold text-navy-900">Power:</span>
                      <span className="text-navy-800">{consultation.power_text}</span>
                    </div>
                  )}
                  {consultation.mmse_score !== null && (
                    <div className="flex justify-between border-b border-navy-100/80 pb-1">
                      <span className="font-semibold text-navy-900">Mental Status (MMSE):</span>
                      <span className="text-navy-800 font-mono">{consultation.mmse_score} / 30</span>
                    </div>
                  )}
                  {consultation.gcs_score !== null && (
                    <div className="flex justify-between border-b border-navy-100/80 pb-1">
                      <span className="font-semibold text-navy-900">Glasgow Coma Scale:</span>
                      <span className="text-navy-800 font-mono">{consultation.gcs_score} / 15</span>
                    </div>
                  )}
                  {consultation.additional_observations && (
                    <div className="sm:col-span-2 pt-1 text-navy-700 italic">
                      <strong className="text-navy-900 not-italic">Observations:</strong>{' '}
                      {consultation.additional_observations}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── DIAGNOSTIC TESTS (Section 15 — Only if populated) ─── */}
            {hasDiagnosticTests && (
              <div className="report-section page-break-inside-avoid rounded-lg border border-navy-300 bg-white overflow-hidden text-xs">
                <div className="section-banner bg-[#1B365D] text-white px-3 py-1 font-bold text-[11px] tracking-wide flex justify-between items-center">
                  <span>DIAGNOSTIC TESTS</span>
                  <span className="font-serif font-medium" dir="rtl">
                    تشخیصی ٹیسٹ
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="diagnostic-table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-navy-100/80 text-navy-900 border-b border-navy-200 text-[11px]">
                        <th className="p-2 w-8">#</th>
                        <th className="p-2">Test Name</th>
                        <th className="p-2">Indication / Category</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Findings / Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-200">
                      {consultation.diagnostic_tests?.map((t, idx) => (
                        <tr key={idx} className="hover:bg-navy-50/50">
                          <td className="p-2 font-mono text-navy-500">{idx + 1}</td>
                          <td className="p-2 font-bold text-navy-900">{t.test_name}</td>
                          <td className="p-2 text-navy-700">{t.clinical_indication || t.category || '—'}</td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy-100 text-navy-800 border border-navy-200">
                              {t.status}
                            </span>
                          </td>
                          <td className="p-2 text-navy-800">
                            {t.result || 'Pending'}
                            {t.doctor_notes && <span className="block text-[10px] text-navy-500">Note: {t.doctor_notes}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── CLINICAL INFORMATION (Section 16 — Only if populated) ─── */}
            {hasClinicalInfo && (
              <div className="report-section page-break-inside-avoid rounded-lg border border-navy-300 bg-white overflow-hidden text-xs">
                <div className="section-banner bg-[#1B365D] text-white px-3 py-1 font-bold text-[11px] tracking-wide flex justify-between items-center">
                  <span>CLINICAL INFORMATION & ADVICE</span>
                  <span className="font-serif font-medium" dir="rtl">
                    طبی معلومات اور مشورہ
                  </span>
                </div>
                <div className="p-3 space-y-2 bg-navy-50/30">
                  {consultation.clinical_description && (
                    <div>
                      <span className="font-bold text-navy-900 block mb-0.5">Clinical Assessment:</span>
                      <p className="text-navy-800 leading-relaxed">{consultation.clinical_description}</p>
                    </div>
                  )}
                  {consultation.additional_examination && (
                    <div>
                      <span className="font-bold text-navy-900 block mb-0.5">Additional Examination:</span>
                      <p className="text-navy-800 leading-relaxed">{consultation.additional_examination}</p>
                    </div>
                  )}
                  {consultation.treatment_plan && (
                    <div>
                      <span className="font-bold text-navy-900 block mb-0.5">Treatment Plan / Advice:</span>
                      <p className="text-navy-800 leading-relaxed">{consultation.treatment_plan}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── PRESCRIPTION TABLE (Section 17 & 18 — Only if populated) ─── */}
            {hasPrescription && (
              <div className="report-section prescription-section rounded-lg border border-navy-300 bg-white overflow-hidden text-xs">
                <div className="section-banner bg-[#1B365D] text-white px-3 py-1 font-bold text-[11px] tracking-wide flex justify-between items-center">
                  <span>PRESCRIPTION</span>
                  <span className="font-serif font-medium" dir="rtl">
                    تجویز کردہ ادویات
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="prescription-table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-navy-100/80 text-navy-900 border-b border-navy-200 text-[11px]">
                        <th className="p-2.5 w-8">S#</th>
                        <th className="p-2.5">Medicine Name</th>
                        <th className="p-2.5">Dosage</th>
                        <th className="p-2.5">Frequency (Urdu/Eng)</th>
                        <th className="p-2.5">Duration</th>
                        <th className="p-2.5">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-200">
                      {consultation.prescriptions?.map((rx, idx) => (
                        <tr key={idx} className="hover:bg-navy-50/50">
                          <td className="p-2.5 font-mono text-navy-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-navy-950">{rx.medicine_name}</td>
                          <td className="p-2.5 text-navy-800">{rx.dosage}</td>
                          <td className="p-2.5 text-navy-900 font-medium">
                            <span className="font-serif" dir="rtl">{rx.frequency_name}</span>
                          </td>
                          <td className="p-2.5 text-navy-800 whitespace-nowrap">{rx.duration_days} Days</td>
                          <td className="p-2.5 text-navy-800">
                            <span className="font-serif" dir="rtl">{rx.instruction_name || '—'}</span>
                            {rx.custom_instruction && (
                              <span className="block text-[11px] text-navy-500">
                                ({rx.custom_instruction})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── FOLLOW-UP (Section 22 — Only if populated) ─── */}
            {hasFollowUp && (
              <div className="report-section page-break-inside-avoid rounded-lg border border-navy-300 bg-white overflow-hidden text-xs">
                <div className="section-banner bg-[#1B365D] text-white px-3 py-1 font-bold text-[11px] tracking-wide flex justify-between items-center">
                  <span>FOLLOW-UP</span>
                  <span className="font-serif font-medium" dir="rtl">
                    فالو اَپ
                  </span>
                </div>
                <div className="p-3 space-y-1.5 bg-navy-50/30">
                  <div className="flex flex-wrap items-center gap-4">
                    {consultation.follow_up_date && (
                      <div>
                        <span className="font-bold text-navy-900">Follow-Up Date:</span>{' '}
                        <span className="font-semibold text-navy-950">
                          {new Date(consultation.follow_up_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {consultation.follow_up_period && (
                      <div>
                        <span className="font-bold text-navy-900">Period:</span>{' '}
                        <span className="text-navy-950 font-serif" dir="rtl">{consultation.follow_up_period}</span>
                      </div>
                    )}
                  </div>
                  {consultation.follow_up_instructions && (
                    <p className="text-navy-700 italic border-t border-navy-100/80 pt-1">
                      <strong className="text-navy-900 not-italic">Instructions:</strong>{' '}
                      {consultation.follow_up_instructions}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ─── DOCTOR'S SIGNATURE & VALIDITY (Section 23) ─── */}
            <div className="signature-block page-break-inside-avoid pt-6 pb-2 flex flex-col sm:flex-row justify-between items-end gap-6 border-t border-navy-200">
              <div className="text-[11px] font-bold text-navy-600">
                VALID FOR 1 MONTH FROM CONSULTATION DATE
              </div>

              <div className="text-right space-y-1">
                <div className="w-56 border-b border-navy-400 mb-1 ml-auto" />
                <p className="font-bold text-navy-900 text-xs">Doctor's Signature & Stamp</p>
                <p className="font-bold text-[#1B365D] text-xs">Dr. Abdul Rauf</p>
                <p className="text-[11px] text-navy-500">Consultant Neurologist</p>
              </div>
            </div>

            {/* ─── FOOTER (Section 24) ─── */}
            <div className="report-footer pt-3 border-t border-navy-200 text-center text-[10px] text-navy-500 space-y-0.5">
              <p>
                Printed from Dr. Rauf Neurology Clinic EMR System | Contact: 0300-1234567 | drrauf.clinic@gmail.com
              </p>
              <p className="text-navy-400">
                Valid only with Doctor's stamp and signature • Electronic Medical Record
              </p>
            </div>

          </div>
        )}
      </div>
    </Dialog>
  );
};
