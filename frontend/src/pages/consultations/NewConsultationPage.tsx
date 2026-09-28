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
import { SaveConsultationBar } from '../../components/consultation/SaveConsultationBar';
import { ConsultationSuccessModal } from '../../components/consultation/ConsultationSuccessModal';
import { ConsultationDetailModal } from '../../components/consultation/ConsultationDetailModal';

import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { SkeletonCard } from '../../components/ui/LoadingSkeleton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import type {
  ConsultationVitals,
  ConsultationSymptom,
  ConsultationExamination,
  ConsultationCreatePayload,
} from '../../types/consultation';

export const NewConsultationPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
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

  // UI state modals
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [savedConsultationId, setSavedConsultationId] = useState<string>('');
  const [selectedHistoryDetailId, setSelectedHistoryDetailId] = useState<string | null>(null);

  // Form structured state
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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState<boolean>(false);

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

  // Save consultation mutation
  const saveMutation = useMutation({
    mutationFn: (payload: ConsultationCreatePayload) =>
      consultationService.createConsultation(payload),
    onSuccess: (created) => {
      setIsDirty(false);
      setSavedConsultationId(created.consultation_id);
      setIsSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ['patient-consultations', patientId] });
      success('Consultation record saved successfully.', 'Consultation Saved');
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

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toastError('Please resolve validation errors before saving.', 'Validation Notice');
      return;
    }

    if (!patient) return;

    // Filter examinations that have either status 'Not Done' or a finding/observation
    const validExams = examinations.filter(
      (e) => e.status === 'Not Done' || (e.finding && e.finding.trim() !== '') || (e.observation && e.observation.trim() !== '')
    );

    const payload: ConsultationCreatePayload = {
      patient_id: patient.patient_id,
      patient_state_name: patientStateName || 'Stable',
      patient_state_id: patientStateId,
      symptom_notes: symptomNotes.trim() || null,
      power_text: powerText.trim() || null,
      mmse_score: mmseScore,
      gcs_score: gcsScore,
      additional_observations: additionalObservations.trim() || null,
      vitals: vitals,
      symptoms: symptoms,
      examinations: validExams,
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

  if (isPatientLoading) {
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

      {/* ─── 2. Vital Signs ─── */}
      <VitalsSection
        vitals={vitals}
        onChange={(newVitals) => {
          setVitals(newVitals);
          markDirty();
        }}
        errors={formErrors}
      />

      {/* ─── 3. Fall Risk Assessment ─── */}
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

      {/* ─── 4. Symptom Analysis ─── */}
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

      {/* ─── 5. Patient Clinical State ─── */}
      <PatientStateSection
        selectedStateName={patientStateName}
        selectedStateId={patientStateId}
        onChange={(stateName, stateId) => {
          setPatientStateName(stateName);
          setPatientStateId(stateId ?? null);
          markDirty();
        }}
      />

      {/* ─── 6. Neurological Examination Matrix ─── */}
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

      {/* ─── 7. Additional Observations ─── */}
      <AdditionalObservationsCard
        observations={additionalObservations}
        onChange={(val) => {
          setAdditionalObservations(val);
          markDirty();
        }}
      />

      {/* ─── 8. Mental Status Scores ─── */}
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

      {/* ─── 9. Sticky Save Action Bar ─── */}
      <SaveConsultationBar
        onSave={handleSave}
        isSaving={saveMutation.isPending}
        isDirty={isDirty}
        hasErrors={Object.keys(formErrors).length > 0}
        symptomCount={symptoms.length}
        examinationsCount={examinations.length}
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
        onBackToPatient={() => {
          setIsSuccessModalOpen(false);
          navigate(`/patients/${patient.patient_id}`);
        }}
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
        message="You have unsaved consultation information. Are you sure you want to leave?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        isDestructive={false}
      />
    </div>
  );
};
