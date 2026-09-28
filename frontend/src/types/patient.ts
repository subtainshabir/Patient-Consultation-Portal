export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to specify';

export interface Patient {
  id: number;
  patient_id: string; // e.g. DRN-000001
  full_name: string;
  age: number;
  gender: Gender;
  mobile_number: string;
  cnic: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientFormData {
  full_name: string;
  age: number;
  gender: Gender;
  mobile_number: string;
  cnic?: string;
  confirm_duplicate?: boolean;
}

export interface PatientListResponse {
  items: Patient[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DuplicatePatientWarning {
  is_duplicate: boolean;
  message: string;
  existing_patient: Patient;
}

export interface PatientQueryParams {
  search?: string;
  page?: number;
  page_size?: number;
  is_active?: boolean | null;
  gender?: string | null;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
