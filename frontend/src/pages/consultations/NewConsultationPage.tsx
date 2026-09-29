import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

import { patientService } from '../../services/patientService';
import { consultationService } from '../../services/consultationService';
import { useToast } from '../../hooks/useToast';

import { ConsultationHeader } from '../../components/consultation/ConsultationHeader';
import { MedicalHistoryDrawer } from '../../components/consultation/MedicalHistoryDrawer';
import { VitalsSection } from '../../components/consultation/VitalsSection';
import { FallRiskCard } from '../../components/consultation/FallRiskCard';
import { SymptomAnalysisSection } from '../../components/consultation/SymptomAnalysisSection';
import { PatientStateSection } from '../../components/consultation/PatientStateSection';
import { NeurologicalExamSection } from '../../components/consultation/NeurologicalExamSection';
import { MentalStatusScoresCard } from '../../components/consultation/MentalStatusScoresCard';
import { AdditionalObservationsCard } from '../../components/consultation/AdditionalObservationsCard';
import { DiagnosticTestsSection } from '../../components/consultation/DiagnosticTestsSection';
import { ClinicalAssessmentSection } from '../../components/consultation/ClinicalAssessmentSection';
import { AdditionalExaminationSection } from '../../components/consultation/AdditionalExaminationSection';
import { TreatmentPlanSection } from '../../components/consultation/TreatmentPlanSection';
import { PrescriptionSection } from '../../components/consultation/PrescriptionSection';
import { FollowUpSection } from '../../components/consultation/FollowUpSection';
import { SaveConsultationBar } from '../../components/consultation/SaveConsultationBar';
import { ConsultationSuccessModal } from '../../components/consultation/ConsultationSuccessModal';
import { ConsultationDetailModal } from '../../components/consultation/ConsultationDetailModal';
import { PrescriptionReportModal } from '../../components/consultation/PrescriptionReportModal';
import { ConsultationNav } from '../../components/consultation/ConsultationNav';

import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { SkeletonCard } from '../../components/ui/LoadingSkeleton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import type {
  ConsultationVitals,
  ConsultationSymptom,
  ConsultationExamination,
  ConsultationDiagnosticTest,
  PrescriptionItem,
  ConsultationCreatePayload,
} from '../../types/consultation';

export const NewConsultationPage: React.FC = () => {
  const { patientId, consultationId } = useParams<{
    patientId: string;
    consultationId?: string;
  }>();
  const isEditMode = Boolean(consultationId);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: toastError } = useToast();

  // 1. Fetch Patient details
  const {
    data: patient,
    isLoading: isPatientLoading,
    error: patientError,
  } = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.getPatientById(patientId!),
    enabled: !!patientId,
  });

  // 2. Fetch Authoritative Server Date
  const { data: serverDateData } = useQuery({
    queryKey: ['consultation-server-date'],
    queryFn: () => consultationService.getServerDate(),
    staleTime: 60000,
  });

  const serverDateFormatted = React.useMemo(() => {
    if (serverDateData?.formatted_date) {
      return serverDateData.formatted_date;
    }
    return '';
  }, [serverDateData?.formatted_date]);

  // 3. Fetch Patient Previous Consultations (for medical history)
  const {
    data: patientHistory = [],
    isLoading: isHistoryLoading,
  } = useQuery({
    queryKey: ['patient-consultations', patientId],
    queryFn: () => consultationService.getPatientConsultations(patientId!),
    enabled: !!patientId,
  });

  // 4. Fetch Existing Consultation if in Edit Mode
  const {
    data: existingConsultation,
    isLoading: isExistingLoading,
  } = useQuery({
    queryKey: ['consultation', consultationId],
    queryFn: () => consultationService.getConsultation(consultationId!),
    enabled: isEditMode && !!consultationId,
  });

  // UI state modals
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [savedConsultationId, setSavedConsultationId] = useState<string>('');
  const [selectedHistoryDetailId, setSelectedHistoryDetailId] = useState<string | null>(null);
  const [reportModalConsultationId, setReportModalConsultationId] = useState<string | null>(null);

  // Form structured state (Phases 4 & 5)
  const [vitals, setVitals] = useState<ConsultationVitals>({
    systolic_bp: null,
    diastolic_bp: null,
    pulse_rate: null,
    temperature: null,
    oxygen_saturation: null,
    nihss_score: null,
    fall_risk_status: null,
    fall_risk_notes: '',
  });

  const [symptoms, setSymptoms] = useState<ConsultationSymptom[]>([]);
  const [symptomNotes, setSymptomNotes] = useState<string>('');
  const [patientStateName, setPatientStateName] = useState<string>('Stable');
  const [patientStateId, setPatientStateId] = useState<number | null>(null);

  const [examinations, setExaminations] = useState<ConsultationExamination[]>([]);
  const [powerText, setPowerText] = useState<string>('');

  const [mmseScore, setMmseScore] = useState<number | null>(null);
  const [gcsScore, setGcsScore] = useState<number | null>(null);
  const [additionalObservations, setAdditionalObservations] = useState<string>('');

  // Phase 5 Fields
  const [diagnosticTests, setDiagnosticTests] = useState<ConsultationDiagnosticTest[]>([]);
  const [clinicalDescription, setClinicalDescription] = useState<string>('');
  const [additionalExamination, setAdditionalExamination] = useState<string>('');
  const [treatmentPlan, setTreatmentPlan] = useState<string>('');

  // Phase 6 Field
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);

  // Phase 7 Follow-Up Fields
  const [followUpOptionId, setFollowUpOptionId] = useState<number | null>(null);
  const [followUpPeriod, setFollowUpPeriod] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState<string | null>(null);
  const [followUpInstructions, setFollowUpInstructions] = useState<string>('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showDraftBanner, setShowDraftBanner] = useState<boolean>(false);

  const DRAFT_KEY = `dr_rauf_draft_${patientId}`;

  // Restore unsaved draft on initial load (Section 4)
  useEffect(() => {
    if (!isEditMode && patientId) {
      try {
        const savedDraft = sessionStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.vitals) setVitals(parsed.vitals);
          if (parsed.symptoms) setSymptoms(parsed.symptoms);
          if (parsed.symptomNotes) setSymptomNotes(parsed.symptomNotes);
          if (parsed.patientStateName) setPatientStateName(parsed.patientStateName);
          if (parsed.patientStateId !== undefined) setPatientStateId(parsed.patientStateId);
          if (parsed.powerText) setPowerText(parsed.powerText);
          if (parsed.examinations) setExaminations(parsed.examinations);
          if (parsed.additionalObservations) setAdditionalObservations(parsed.additionalObservations);
          if (parsed.mmseScore !== undefined) setMmseScore(parsed.mmseScore);
          if (parsed.gcsScore !== undefined) setGcsScore(parsed.gcsScore);
          if (parsed.diagnosticTests) setDiagnosticTests(parsed.diagnosticTests);
          if (parsed.clinicalDescription) setClinicalDescription(parsed.clinicalDescription);
          if (parsed.additionalExamination) setAdditionalExamination(parsed.additionalExamination);
          if (parsed.treatmentPlan) setTreatmentPlan(parsed.treatmentPlan);
          if (parsed.prescriptions) setPrescriptions(parsed.prescriptions);
          if (parsed.followUpOptionId !== undefined) setFollowUpOptionId(parsed.followUpOptionId);
          if (parsed.followUpPeriod !== undefined) setFollowUpPeriod(parsed.followUpPeriod);
          if (parsed.followUpDate !== undefined) setFollowUpDate(parsed.followUpDate);
          if (parsed.followUpInstructions !== undefined) setFollowUpInstructions(parsed.followUpInstructions);
          setShowDraftBanner(true);
          setIsDirty(true);
        }
      } catch (e) {
        console.error('Failed to parse saved consultation draft:', e);
      }
    }
  }, [isEditMode, patientId, DRAFT_KEY]);

  // Debounced auto-save draft to sessionStorage (Section 4)
  useEffect(() => {
    if (isEditMode || !patientId || !isDirty) return;

    const timer = setTimeout(() => {
      try {
        const draft = {
          vitals,
          symptoms,
          symptomNotes,
          patientStateName,
          patientStateId,
          powerText,
          examinations,
          additionalObservations,
          mmseScore,
          gcsScore,
          diagnosticTests,
          clinicalDescription,
          additionalExamination,
          treatmentPlan,
          prescriptions,
          followUpOptionId,
          followUpPeriod,
          followUpDate,
          followUpInstructions,
          updatedAt: new Date().toISOString(),
        };
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {
        console.error('Failed to auto-save consultation draft:', e);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    isEditMode,
    patientId,
    isDirty,
    vitals,
    symptoms,
    symptomNotes,
    patientStateName,
    patientStateId,
    powerText,
    examinations,
    additionalObservations,
    mmseScore,
    gcsScore,
    diagnosticTests,
    clinicalDescription,
    additionalExamination,
    treatmentPlan,
    prescriptions,
    followUpOptionId,
    followUpPeriod,
    followUpDate,
    followUpInstructions,
    DRAFT_KEY,
  ]);

  const handleDiscardDraft = () => {
    sessionStorage.removeItem(DRAFT_KEY);
    setShowDraftBanner(false);
    setIsDirty(false);
    setVitals({
      systolic_bp: null,
      diastolic_bp: null,
      pulse_rate: null,
      temperature: null,
      oxygen_saturation: null,
      nihss_score: null,
      fall_risk_status: null,
      fall_risk_notes: '',
    });
    setSymptoms([]);
    setSymptomNotes('');
    setPatientStateName('Stable');
    setPatientStateId(null);
    setExaminations([]);
    setPowerText('');
    setMmseScore(null);
    setGcsScore(null);
    setAdditionalObservations('');
    setDiagnosticTests([]);
    setClinicalDescription('');
    setAdditionalExamination('');
    setTreatmentPlan('');
    setPrescriptions([]);
    setFollowUpOptionId(null);
    setFollowUpPeriod(null);
    setFollowUpDate(null);
    setFollowUpInstructions('');
  };

  // Completion Map for Navigation Indicators (Section 8)
  const completedMap = React.useMemo(() => {
    const hasVitals = Boolean(
      vitals.systolic_bp ||
      vitals.diastolic_bp ||
      vitals.pulse_rate ||
      vitals.temperature ||
      vitals.oxygen_saturation ||
      vitals.nihss_score !== null
    );

    const hasSymptoms = symptoms.length > 0 || Boolean(symptomNotes);
    const hasFallRisk = vitals.fall_risk_status !== null && vitals.fall_risk_status !== undefined;
    const hasNeuro = examinations.length > 0 || Boolean(powerText) || mmseScore !== null || gcsScore !== null;
    const hasAddExam = Boolean(additionalExamination);
    const hasTests = diagnosticTests.length > 0;
    const hasPrescription = prescriptions.length > 0;
    const hasAssessment = Boolean(clinicalDescription || treatmentPlan);
    const hasFollowUp = Boolean(followUpPeriod || followUpDate || followUpInstructions);

    return {
      'section-vitals': hasVitals,
      'section-symptoms': hasSymptoms,
      'section-fall-risk': hasFallRisk,
      'section-neuro': hasNeuro,
      'section-additional-exam': hasAddExam,
      'section-tests': hasTests,
      'section-prescription': hasPrescription,
      'section-assessment': hasAssessment,
      'section-followup': hasFollowUp,
    };
  }, [
    vitals,
    symptoms,
    symptomNotes,
    examinations,
    powerText,
    mmseScore,
    gcsScore,
    additionalExamination,
    diagnosticTests,
    prescriptions,
    clinicalDescription,
    treatmentPlan,
    followUpPeriod,
    followUpDate,
    followUpInstructions,
  ]);

  // Populate existing consultation fields if in Edit Mode
  useEffect(() => {
    if (existingConsultation) {
      if (existingConsultation.vitals) {
        setVitals(existingConsultation.vitals);
      }
      if (existingConsultation.symptoms) {
        setSymptoms(existingConsultation.symptoms);
      }
      if (existingConsultation.patient_state_name) {
        setPatientStateName(existingConsultation.patient_state_name);
      }
      if (existingConsultation.patient_state_id !== undefined) {
        setPatientStateId(existingConsultation.patient_state_id);
      }
      if (existingConsultation.symptom_notes) {
        setSymptomNotes(existingConsultation.symptom_notes);
      }
      if (existingConsultation.power_text) {
        setPowerText(existingConsultation.power_text);
      }
      if (existingConsultation.examinations) {
        setExaminations(existingConsultation.examinations);
      }
      if (existingConsultation.additional_observations) {
        setAdditionalObservations(existingConsultation.additional_observations);
      }
      if (existingConsultation.mmse_score !== undefined) {
        setMmseScore(existingConsultation.mmse_score);
      }
      if (existingConsultation.gcs_score !== undefined) {
        setGcsScore(existingConsultation.gcs_score);
      }
      if (existingConsultation.diagnostic_tests) {
        setDiagnosticTests(existingConsultation.diagnostic_tests);
      }
      if (existingConsultation.clinical_description) {
        setClinicalDescription(existingConsultation.clinical_description);
      }
      if (existingConsultation.additional_examination) {
        setAdditionalExamination(existingConsultation.additional_examination);
      }
      if (existingConsultation.treatment_plan) {
        setTreatmentPlan(existingConsultation.treatment_plan);
      }
      if (existingConsultation.prescriptions) {
        setPrescriptions(existingConsultation.prescriptions);
      }
      if (existingConsultation.follow_up_option_id !== undefined) {
        setFollowUpOptionId(existingConsultation.follow_up_option_id);
      }
      if (existingConsultation.follow_up_period !== undefined) {
        setFollowUpPeriod(existingConsultation.follow_up_period);
      }
      if (existingConsultation.follow_up_date !== undefined) {
        setFollowUpDate(existingConsultation.follow_up_date);
      }
      if (existingConsultation.follow_up_instructions !== undefined) {
        setFollowUpInstructions(existingConsultation.follow_up_instructions || '');
      }
      setIsDirty(false);
    }
  }, [existingConsultation]);

  // Track user edits to mark form dirty
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Listen for browser navigation / close attempt when form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Save / Update consultation mutation
  const saveMutation = useMutation({
    mutationFn: (payload: ConsultationCreatePayload) => {
      if (isEditMode && consultationId) {
        return consultationService.updateConsultation(consultationId, payload);
      }
      return consultationService.createConsultation(payload);
    },
    onSuccess: (saved) => {
      setIsDirty(false);
      setShowDraftBanner(false);
      sessionStorage.removeItem(DRAFT_KEY);
      setSavedConsultationId(saved.consultation_id);
      setIsSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['patient-consultations', patientId] });
      queryClient.invalidateQueries({ queryKey: ['consultation', saved.consultation_id] });
      queryClient.invalidateQueries({ queryKey: ['consultations'] });
      success(
        isEditMode
          ? `Consultation ${saved.consultation_id} updated successfully.`
          : `Consultation ${saved.consultation_id} recorded successfully.`,
        isEditMode ? 'Consultation Updated' : 'Consultation Saved'
      );
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Unable to save consultation.';
      toastError(
        `${msg} Your entered information has not been discarded. Please try again.`,
        'Save Failed'
      );
    },
  });

  // Form validation
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (vitals.systolic_bp !== null && vitals.systolic_bp !== undefined) {
      if (vitals.systolic_bp < 40 || vitals.systolic_bp > 300) {
        errs.systolic_bp = 'Systolic BP must be between 40 and 300 mmHg';
      }
    }
    if (vitals.diastolic_bp !== null && vitals.diastolic_bp !== undefined) {
      if (vitals.diastolic_bp < 20 || vitals.diastolic_bp > 200) {
        errs.diastolic_bp = 'Diastolic BP must be between 20 and 200 mmHg';
      }
    }
    if (vitals.pulse_rate !== null && vitals.pulse_rate !== undefined) {
      if (vitals.pulse_rate < 20 || vitals.pulse_rate > 250) {
        errs.pulse_rate = 'Pulse rate must be between 20 and 250 bpm';
      }
    }
    if (vitals.temperature !== null && vitals.temperature !== undefined) {
      if (vitals.temperature < 25.0 || vitals.temperature > 45.0) {
        errs.temperature = 'Temperature must be between 25.0°C and 45.0°C';
      }
    }
    if (vitals.oxygen_saturation !== null && vitals.oxygen_saturation !== undefined) {
      if (vitals.oxygen_saturation < 40 || vitals.oxygen_saturation > 100) {
        errs.oxygen_saturation = 'Oxygen saturation must be between 40% and 100%';
      }
    }
    if (vitals.nihss_score !== null && vitals.nihss_score !== undefined) {
      if (vitals.nihss_score < 0 || vitals.nihss_score > 42) {
        errs.nihss_score = 'NIHSS score must be between 0 and 42';
      }
    }
    if (mmseScore !== null && mmseScore !== undefined) {
      if (mmseScore < 0 || mmseScore > 30) {
        errs.mmse_score = 'MMSE score must be between 0 and 30';
      }
    }
    if (gcsScore !== null && gcsScore !== undefined) {
      if (gcsScore < 3 || gcsScore > 15) {
        errs.gcs_score = 'GCS score must be between 3 and 15';
      }
    }

    // Phase 6: Validate Prescriptions
    prescriptions.forEach((item, index) => {
      if (!item.medicine_name || !item.medicine_name.trim()) {
        errs[`prescriptions.${index}.medicine_name`] = 'Medicine name is required';
      }
      if (!item.frequency_name || !item.frequency_name.trim()) {
        errs[`prescriptions.${index}.frequency_name`] = 'Frequency is required';
      }
      if (!item.dosage || !item.dosage.trim()) {
        errs[`prescriptions.${index}.dosage`] = 'Dosage is required';
      }
      if (item.duration_days === undefined || item.duration_days === null || item.duration_days <= 0) {
        errs[`prescriptions.${index}.duration_days`] = 'Duration must be greater than 0';
      }
    });

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (saveMutation.isPending) return;
    if (!validateForm()) {
      toastError('Please resolve validation errors before saving.', 'Validation Notice');
      return;
    }

    if (!patient) return;

    // Filter examinations that have either status 'Not Done' or a finding/observation
    const validExams = examinations.filter(
      (e) =>
        e.status === 'Not Done' ||
        (e.finding && e.finding.trim() !== '') ||
        (e.observation && e.observation.trim() !== '')
    );

    const payload: ConsultationCreatePayload = {
      patient_id: patient.patient_id,
      consultation_date: isEditMode && existingConsultation?.consultation_date
        ? existingConsultation.consultation_date
        : (serverDateData?.iso_timestamp || null),
      patient_state_name: patientStateName || 'Stable',
      patient_state_id: patientStateId,
      symptom_notes: symptomNotes.trim() || null,
      power_text: powerText.trim() || null,
      mmse_score: mmseScore,
      gcs_score: gcsScore,
      additional_observations: additionalObservations.trim() || null,
      clinical_description: clinicalDescription.trim() || null,
      additional_examination: additionalExamination.trim() || null,
      treatment_plan: treatmentPlan.trim() || null,
      follow_up_option_id: followUpOptionId,
      follow_up_period: followUpPeriod?.trim() || null,
      follow_up_date: followUpDate || null,
      follow_up_instructions: followUpInstructions.trim() || null,
      vitals: vitals,
      symptoms: symptoms,
      examinations: validExams,
      diagnostic_tests: diagnosticTests,
      prescriptions: prescriptions,
    };

    saveMutation.mutate(payload);
  };

  // Back button handler with unsaved confirmation
  const handleBack = () => {
    if (isDirty) {
      setIsUnsavedDialogOpen(true);
    } else {
      navigate(`/patients/${patientId}`);
    }
  };

  if (isPatientLoading || (isEditMode && isExistingLoading)) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-pulse p-4">
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-4">
        <Card className="p-8">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-950 mb-2">Patient not found.</h2>
          <p className="text-sm text-navy-600 mb-6">
            Unable to load the requested patient record for this consultation.
          </p>
          <Button variant="primary" onClick={() => navigate('/patients')}>
            Back to Patients
          </Button>
        </Card>
      </div>
    );
  }

  if (
    isEditMode &&
    existingConsultation &&
    patient &&
    existingConsultation.patient?.patient_id !== patient.patient_id &&
    String(existingConsultation.patient_id) !== String(patient.id)
  ) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-4">
        <Card className="p-8">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-950 mb-2">Patient Mismatch</h2>
          <p className="text-sm text-navy-600 mb-6">
            Consultation {existingConsultation.consultation_id} does not belong to patient {patient.patient_id}.
          </p>
          <Button variant="primary" onClick={() => navigate(`/patients/${patient.patient_id}`)}>
            Back to Patient Profile
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 animate-in fade-in duration-200">
      {/* ─── 1. Consultation Header ─── */}
      <ConsultationHeader
        patient={patient}
        serverDateFormatted={serverDateFormatted}
        onBack={handleBack}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onViewPatient={() => navigate(`/patients/${patient.patient_id}`)}
        historyCount={patientHistory.length}
      />

      {/* ─── Section Quick Navigation with Completion Indicators (Section 7 & 8) ─── */}
      <ConsultationNav completedMap={completedMap} />

      {/* Draft Restored Banner (Section 4) */}
      {showDraftBanner && (
        <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold">Auto-Save Restored:</span>
            <span>Your unsaved consultation draft has been restored from your previous session.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowDraftBanner(false)}
              className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-colors"
            >
              Keep Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40 font-semibold transition-colors"
            >
              Discard Draft
            </button>
          </div>
        </div>
      )}

      {/* Edit Mode Banner */}
      {isEditMode && existingConsultation && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold">Editing Consultation:</span>
            <span className="font-mono font-semibold">{existingConsultation.consultation_id}</span>
            <span className="text-amber-500">•</span>
            <span>Recorded on {new Date(existingConsultation.consultation_date).toLocaleDateString()}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-200/70 font-semibold text-[11px]">
            Edit Mode
          </span>
        </div>
      )}

      {/* ─── 2. Vital Signs ─── */}
      <div id="section-vitals" className="scroll-mt-32">
        <VitalsSection
          vitals={vitals}
          onChange={(newVitals) => {
            setVitals(newVitals);
            markDirty();
          }}
          errors={formErrors}
        />
      </div>

      {/* ─── 3. Fall Risk Assessment ─── */}
      <div id="section-fall-risk" className="scroll-mt-32">
        <FallRiskCard
          status={vitals.fall_risk_status}
          notes={vitals.fall_risk_notes}
          onChangeStatus={(status) => {
            setVitals((prev) => ({ ...prev, fall_risk_status: status }));
            markDirty();
          }}
          onChangeNotes={(notes) => {
            setVitals((prev) => ({ ...prev, fall_risk_notes: notes }));
            markDirty();
          }}
        />
      </div>

      {/* ─── 4. Symptoms & Clinical State ─── */}
      <div id="section-symptoms" className="scroll-mt-32 space-y-6">
        <SymptomAnalysisSection
          symptoms={symptoms}
          symptomNotes={symptomNotes}
          onSymptomsChange={(newSymptoms) => {
            setSymptoms(newSymptoms);
            markDirty();
          }}
          onNotesChange={(notes) => {
            setSymptomNotes(notes);
            markDirty();
          }}
        />

        <PatientStateSection
          selectedStateName={patientStateName}
          selectedStateId={patientStateId}
          onChange={(stateName, stateId) => {
            setPatientStateName(stateName);
            setPatientStateId(stateId ?? null);
            markDirty();
          }}
        />
      </div>

      {/* ─── 6. Neurological Examination Matrix ─── */}
      <div id="section-neuro" className="scroll-mt-32 space-y-6">
        <NeurologicalExamSection
          examinations={examinations}
          onChangeExaminations={(newExams) => {
            setExaminations(newExams);
            markDirty();
          }}
          powerText={powerText}
          onChangePowerText={(power) => {
            setPowerText(power);
            markDirty();
          }}
        />

        <AdditionalObservationsCard
          observations={additionalObservations}
          onChange={(val) => {
            setAdditionalObservations(val);
            markDirty();
          }}
        />

        <MentalStatusScoresCard
          mmseScore={mmseScore}
          gcsScore={gcsScore}
          onChangeMmse={(val) => {
            setMmseScore(val);
            markDirty();
          }}
          onChangeGcs={(val) => {
            setGcsScore(val);
            markDirty();
          }}
          errors={formErrors}
        />
      </div>

      {/* ─── 9. Diagnostic Tests ─── */}
      <div id="section-tests" className="scroll-mt-32">
        <DiagnosticTestsSection
          tests={diagnosticTests}
          onChange={(newTests) => {
            setDiagnosticTests(newTests);
            markDirty();
          }}
        />
      </div>

      {/* ─── 10. Additional Examination ─── */}
      <div id="section-additional-exam" className="scroll-mt-32">
        <AdditionalExaminationSection
          value={additionalExamination}
          onChange={(val) => {
            setAdditionalExamination(val);
            markDirty();
          }}
        />
      </div>

      {/* ─── 11. Clinical Notes & Assessment ─── */}
      <div id="section-assessment" className="scroll-mt-32 space-y-6">
        <ClinicalAssessmentSection
          value={clinicalDescription}
          onChange={(val) => {
            setClinicalDescription(val);
            markDirty();
          }}
        />

        <TreatmentPlanSection
          value={treatmentPlan}
          onChange={(val) => {
            setTreatmentPlan(val);
            markDirty();
          }}
        />
      </div>

      {/* ─── 13. Prescription Management ─── */}
      <div id="section-prescription" className="scroll-mt-32">
        <PrescriptionSection
          prescriptions={prescriptions}
          onChange={(newPrescriptions) => {
            setPrescriptions(newPrescriptions);
            markDirty();
          }}
          errors={formErrors}
        />
      </div>

      {/* ─── 14. Follow-Up Management ─── */}
      <div id="section-followup" className="scroll-mt-32">
        <FollowUpSection
          followUpOptionId={followUpOptionId}
          followUpPeriod={followUpPeriod}
          followUpDate={followUpDate}
          followUpInstructions={followUpInstructions}
          onChangeOption={(optId, pName) => {
            setFollowUpOptionId(optId);
            setFollowUpPeriod(pName);
            markDirty();
          }}
          onChangeDate={(date) => {
            setFollowUpDate(date);
            markDirty();
          }}
          onChangeInstructions={(instructions) => {
            setFollowUpInstructions(instructions);
            markDirty();
          }}
        />
      </div>

      {/* ─── 15. Sticky Save Action Bar ─── */}
      <SaveConsultationBar
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        isDirty={isDirty}
        hasErrors={Object.keys(formErrors).length > 0}
        symptomCount={symptoms.length}
        examinationsCount={examinations.length}
        diagnosticTestCount={diagnosticTests.length}
        prescriptionCount={prescriptions.length}
        hasFollowUp={Boolean(followUpPeriod || followUpDate || (followUpInstructions && followUpInstructions.trim()))}
        isEditMode={isEditMode}
        onCancel={handleBack}
      />

      {/* ─── Medical History Drawer ─── */}
      <MedicalHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        consultations={patientHistory}
        isLoading={isHistoryLoading}
        onSelectConsultation={(cId) => {
          setSelectedHistoryDetailId(cId);
        }}
        patientName={patient.full_name}
      />

      {/* ─── Detail Modal for Selected Past Consultation ─── */}
      <ConsultationDetailModal
        consultationId={selectedHistoryDetailId}
        isOpen={!!selectedHistoryDetailId}
        onClose={() => setSelectedHistoryDetailId(null)}
        onNavigateConsultation={(id) => setSelectedHistoryDetailId(id)}
        allConsultations={patientHistory}
      />

      {/* ─── Success Modal after Save ─── */}
      <ConsultationSuccessModal
        isOpen={isSuccessModalOpen}
        consultationId={savedConsultationId}
        patientName={patient.full_name}
        patientId={patient.patient_id}
        consultationDate={serverDateFormatted}
        onViewConsultation={() => {
          setIsSuccessModalOpen(false);
          setSelectedHistoryDetailId(savedConsultationId);
        }}
        onPreviewReport={() => {
          setIsSuccessModalOpen(false);
          setReportModalConsultationId(savedConsultationId);
        }}
        onBackToPatient={() => {
          setIsSuccessModalOpen(false);
          navigate(`/patients/${patient.patient_id}`);
        }}
      />

      {/* ─── Prescription Report & PDF Modal ─── */}
      <PrescriptionReportModal
        consultationId={reportModalConsultationId}
        isOpen={!!reportModalConsultationId}
        onClose={() => setReportModalConsultationId(null)}
      />

      {/* ─── Unsaved Changes Confirmation Dialog ─── */}
      <ConfirmationDialog
        isOpen={isUnsavedDialogOpen}
        onClose={() => setIsUnsavedDialogOpen(false)}
        onConfirm={() => {
          setIsDirty(false);
          setIsUnsavedDialogOpen(false);
          navigate(`/patients/${patient.patient_id}`);
        }}
        title="Unsaved Changes"
        message="You have unsaved clinical consultation information. Are you sure you want to leave without saving?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        isDestructive={false}
      />
    </div>
  );
};
