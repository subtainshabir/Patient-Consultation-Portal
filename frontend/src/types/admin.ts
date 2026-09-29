export interface ClinicSetting {
  id: number;
  doctor_name: string;
  doctor_name_urdu?: string | null;
  doctor_title: string;
  specialization: string;
  specialization_urdu?: string | null;
  qualifications: string;
  registration_no?: string | null;
  clinic_name: string;
  clinic_name_urdu?: string | null;
  clinic_subtitle?: string | null;
  clinic_phone: string;
  clinic_email: string;
  clinic_address: string;
  logo_path?: string | null;
  has_logo: boolean;
  updated_at?: string | null;
}

export type ClinicSettingUpdate = Partial<
  Omit<ClinicSetting, 'id' | 'has_logo' | 'updated_at'>
>;

export interface CategoryStat {
  category_key: string;
  label: string;
  active: number;
  inactive: number;
  total: number;
}

export interface AdminDashboardStats {
  categories: Record<string, CategoryStat>;
  total_master_items: number;
  total_active_items: number;
  total_inactive_items: number;
  total_patients: number;
  total_consultations: number;
}
