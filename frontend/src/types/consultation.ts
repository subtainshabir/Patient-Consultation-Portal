import type { Patient } from './patient';

export interface ConsultationVitals {
  id?: number;
  consultation_id?: number;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  pulse_rate?: number | null;
  temperature?: number | null;
  oxygen_saturation?: number | null;
  nihss_score?: number | null;
  fall_risk_status?: 'Done' | 'Not Done' | null;
  fall_risk_notes?: string | null;
  respiratory_rate?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  bmi?: number | null;
  blood_glucose?: number | null;
}

export interface ConsultationSymptom {
  id?: number;
  consultation_id?: number;
  symptom_id?: number | null;
  symptom_name: string;
  category?: string | null;
  notes?: string | null;
  sort_order?: number;
}

export interface ConsultationExamination {
  id?: number;
  consultation_id?: number;
  category: string;
  item_name: string;
  finding?: string | null;
  finding_id?: number | null;
  status: 'Done' | 'Not Done';
  observation?: string | null;
}

export type DiagnosticTestStatus = 'Ordered' | 'Pending' | 'Completed' | 'Reviewed';

export interface ConsultationDiagnosticTest {
  id?: number;
  consultation_id?: number;
  diagnostic_test_id?: number | null;
  test_name: string;
  category?: string | null;
  status: DiagnosticTestStatus;
  clinical_indication?: string | null;
  result?: string | null;
  result_date?: string | null;
  doctor_notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Consultation {
  id: number;
  consultation_id: string; // e.g. CNS-20260929-0001
  patient_id: number;
  doctor_id?: number | null;
  consultation_date: string;
  patient_state_id?: number | null;
  patient_state_name?: string | null;
  symptom_notes?: string | null;
  power_text?: string | null;
  mmse_score?: number | null;
  gcs_score?: number | null;
  additional_observations?: string | null;
  clinical_description?: string | null;
  additional_examination?: string | null;
  treatment_plan?: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  vitals?: ConsultationVitals | null;
  symptoms: ConsultationSymptom[];
  examinations: ConsultationExamination[];
  diagnostic_tests: ConsultationDiagnosticTest[];
}

export interface ConsultationSummary {
  id: number;
  consultation_id: string;
  patient_id: number;
  patient_unique_id: string;
  patient_name: string;
  consultation_date: string;
  patient_state_name?: string | null;
  symptom_count: number;
  diagnostic_test_count?: number;
  mmse_score?: number | null;
  gcs_score?: number | null;
  has_vitals: boolean;
  bp_formatted?: string | null;
  pulse_rate?: number | null;
  temperature?: number | null;
  created_at: string;
}

export interface ConsultationCreatePayload {
  patient_id: string;
  patient_state_id?: number | null;
  patient_state_name?: string | null;
  symptom_notes?: string | null;
  power_text?: string | null;
  mmse_score?: number | null;
  gcs_score?: number | null;
  additional_observations?: string | null;
  clinical_description?: string | null;
  additional_examination?: string | null;
  treatment_plan?: string | null;
  vitals?: ConsultationVitals;
  symptoms: ConsultationSymptom[];
  examinations: ConsultationExamination[];
  diagnostic_tests?: ConsultationDiagnosticTest[];
}

export interface ServerDateResponse {
  server_date: string;
  formatted_date: string;
  iso_timestamp: string;
}
