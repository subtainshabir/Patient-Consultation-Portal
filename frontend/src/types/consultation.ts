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

export interface PrescriptionItem {
  id?: number;
  consultation_id?: number;
  medicine_id?: number | null;
  medicine_name: string;
  frequency_id?: number | null;
  frequency_name: string;
  dosage: string;
  duration_days: number;
  instruction_id?: number | null;
  instruction_name?: string | null;
  custom_instruction?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ConsultationReport {
  id: number;
  report_id: string;
  consultation_id: number;
  patient_id: number;
  file_name: string;
  storage_path: string;
  document_type: string;
  file_size: number;
  version: number;
  is_latest: boolean;
  generated_by_id?: number | null;
  created_at: string;
  updated_at: string;
  download_url?: string;
  preview_url?: string;
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
  follow_up_option_id?: number | null;
  follow_up_period?: string | null;
  follow_up_date?: string | null;
  follow_up_instructions?: string | null;
  follow_up_status?: string | null;
  created_at: string;
  updated_at: string;
  patient?: Patient;
  vitals?: ConsultationVitals | null;
  symptoms: ConsultationSymptom[];
  examinations: ConsultationExamination[];
  diagnostic_tests: ConsultationDiagnosticTest[];
  prescriptions?: PrescriptionItem[];
  reports?: ConsultationReport[];
  latest_report?: ConsultationReport | null;
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
  prescription_count?: number;
  mmse_score?: number | null;
  gcs_score?: number | null;
  has_vitals: boolean;
  bp_formatted?: string | null;
  pulse_rate?: number | null;
  temperature?: number | null;
  follow_up_period?: string | null;
  follow_up_date?: string | null;
  follow_up_instructions?: string | null;
  follow_up_status?: string | null;
  symptoms_summary?: string[];
  has_report?: boolean;
  latest_report_id?: string | null;
  latest_report_version?: number | null;
  latest_report_file_name?: string | null;
  latest_report_created_at?: string | null;
  created_at: string;
}

export interface ConsultationCreatePayload {
  patient_id: string;
  consultation_date?: string | null;
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
  follow_up_option_id?: number | null;
  follow_up_period?: string | null;
  follow_up_date?: string | null;
  follow_up_instructions?: string | null;
  vitals?: ConsultationVitals;
  symptoms: ConsultationSymptom[];
  examinations: ConsultationExamination[];
  diagnostic_tests?: ConsultationDiagnosticTest[];
  prescriptions?: PrescriptionItem[];
}

export interface ServerDateResponse {
  server_date: string;
  formatted_date: string;
  iso_timestamp: string;
}

export interface ConsultationListResponse {
  items: ConsultationSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

