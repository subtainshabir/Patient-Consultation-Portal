export type MasterDataCategoryKey =
  | 'symptoms'
  | 'patient-states'
  | 'neurological-examinations'
  | 'diagnostic-tests'
  | 'medicines'
  | 'frequencies'
  | 'dosages'
  | 'instructions'
  | 'follow-ups';

export interface BaseMasterItem {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Symptom extends BaseMasterItem {
  category: string;
}

export interface PatientState extends BaseMasterItem {}

export interface NeurologicalExamOption extends BaseMasterItem {
  category: string;
  item_name?: string | null;
}

export interface DiagnosticTest extends BaseMasterItem {
  category: string;
}

export interface Medicine extends BaseMasterItem {
  generic_name?: string | null;
  strength?: string | null;
  form: string;
}

export interface MedicineFrequency extends BaseMasterItem {
  urdu_label: string;
  roman_urdu?: string | null;
}

export interface MedicineDosage extends BaseMasterItem {
  urdu_label?: string | null;
}

export interface MedicineInstruction extends BaseMasterItem {
  urdu_label: string;
}

export interface FollowUpOption extends BaseMasterItem {
  urdu_label: string;
}

export type MasterDataItem =
  | Symptom
  | PatientState
  | NeurologicalExamOption
  | DiagnosticTest
  | Medicine
  | MedicineFrequency
  | MedicineDosage
  | MedicineInstruction
  | FollowUpOption;

export interface MasterDataListResponse<T = MasterDataItem> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface MasterDataQueryParams {
  search?: string;
  category?: string;
  item_name?: string;
  is_active?: boolean | null;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}
