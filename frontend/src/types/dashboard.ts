export interface AdminRecentPatient {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  mobile_number?: string | null;
  created_at?: string | null;
}

export interface AdminRecentConsultation {
  consultation_id: string;
  patient_id: string;
  patient_name: string;
  consultation_date?: string | null;
  created_at?: string | null;
}

export interface AdminRecentUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at?: string | null;
}

export interface AdminCategoryStatDetail {
  category_key: string;
  label: string;
  active: number;
  inactive: number;
  total: number;
}

export interface AdminDashboardData {
  categories: Record<string, AdminCategoryStatDetail>;
  total_master_items: number;
  total_active_items: number;
  total_inactive_items: number;
  total_patients: number;
  total_consultations: number;
  total_doctors: number;
  total_staff: number;
  active_users: number;
  inactive_users: number;
  active_medicines: number;
  active_symptoms: number;
  active_diagnostic_tests: number;
  active_neuro_exams: number;
  active_follow_ups: number;
  recent_activity: {
    recent_patients: AdminRecentPatient[];
    recent_consultations: AdminRecentConsultation[];
    recent_users: AdminRecentUser[];
  };
}

export interface DoctorTodayConsultation {
  consultation_id: string;
  patient_id: string;
  patient_name: string;
  consultation_date?: string | null;
  bp_formatted?: string | null;
  pulse_rate?: string | null;
  has_report: boolean;
  prescriptions_count: number;
  symptoms: string[];
  patient_state: string;
}

export interface DoctorRecentPatient {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  created_at?: string | null;
}

export interface DoctorRecentConsultation {
  consultation_id: string;
  patient_id: string;
  patient_name: string;
  consultation_date?: string | null;
  prescriptions_count: number;
}

export interface DoctorDashboardData {
  total_patients: number;
  total_consultations: number;
  today_consultations_count: number;
  today_consultations: DoctorTodayConsultation[];
  recent_patients: DoctorRecentPatient[];
  recent_consultations: DoctorRecentConsultation[];
}

export interface StaffPatientSummary {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  mobile_number?: string | null;
  created_at?: string | null;
}

export interface StaffDashboardData {
  total_patients: number;
  today_registered_count: number;
  today_patients: StaffPatientSummary[];
  recent_patients: StaffPatientSummary[];
}
