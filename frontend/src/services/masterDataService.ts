import { api } from './api';
import type {
  MasterDataCategoryKey,
  MasterDataListResponse,
  MasterDataQueryParams,
  Symptom,
  PatientState,
  NeurologicalExamOption,
  DiagnosticTest,
  Medicine,
  MedicineFrequency,
  MedicineDosage,
  MedicineInstruction,
  FollowUpOption,
} from '../types/masterData';

export const masterDataService = {
  async getItems<T>(
    categoryKey: MasterDataCategoryKey,
    params: MasterDataQueryParams = {}
  ): Promise<MasterDataListResponse<T>> {
    const query = new URLSearchParams();

    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.category && params.category !== 'all') {
      query.append('category', params.category);
    }
    if (params.item_name) {
      query.append('item_name', params.item_name);
    }
    if (params.is_active !== undefined && params.is_active !== null) {
      query.append('is_active', params.is_active.toString());
    }
    if (params.sort_by) {
      query.append('sort_by', params.sort_by);
    }
    if (params.sort_order) {
      query.append('sort_order', params.sort_order);
    }
    if (params.page !== undefined) {
      query.append('page', params.page.toString());
    }
    if (params.page_size !== undefined) {
      query.append('page_size', params.page_size.toString());
    }

    const queryString = query.toString();
    const endpoint = queryString
      ? `/master-data/${categoryKey}?${queryString}`
      : `/master-data/${categoryKey}`;
    return api.get<MasterDataListResponse<T>>(endpoint);
  },

  async getItem<T>(categoryKey: MasterDataCategoryKey, id: number): Promise<T> {
    return api.get<T>(`/master-data/${categoryKey}/${id}`);
  },

  async createItem<T>(
    categoryKey: MasterDataCategoryKey,
    data: Record<string, unknown>
  ): Promise<T> {
    return api.post<T>(`/master-data/${categoryKey}`, data);
  },

  async updateItem<T>(
    categoryKey: MasterDataCategoryKey,
    id: number,
    data: Record<string, unknown>
  ): Promise<T> {
    return api.patch<T>(`/master-data/${categoryKey}/${id}`, data);
  },

  async setItemStatus<T>(
    categoryKey: MasterDataCategoryKey,
    id: number,
    isActive: boolean
  ): Promise<T> {
    return api.patch<T>(`/master-data/${categoryKey}/${id}/status`, {
      is_active: isActive,
    });
  },

  // Specialized convenience helpers for clinical workflows
  getSymptoms(params?: MasterDataQueryParams) {
    return this.getItems<Symptom>('symptoms', params);
  },
  getPatientStates(params?: MasterDataQueryParams) {
    return this.getItems<PatientState>('patient-states', params);
  },
  getNeurologicalExaminations(params?: MasterDataQueryParams) {
    return this.getItems<NeurologicalExamOption>('neurological-examinations', params);
  },
  getDiagnosticTests(params?: MasterDataQueryParams) {
    return this.getItems<DiagnosticTest>('diagnostic-tests', params);
  },
  getMedicines(params?: MasterDataQueryParams) {
    return this.getItems<Medicine>('medicines', params);
  },
  getFrequencies(params?: MasterDataQueryParams) {
    return this.getItems<MedicineFrequency>('frequencies', params);
  },
  getDosages(params?: MasterDataQueryParams) {
    return this.getItems<MedicineDosage>('dosages', params);
  },
  getInstructions(params?: MasterDataQueryParams) {
    return this.getItems<MedicineInstruction>('instructions', params);
  },
  getFollowUps(params?: MasterDataQueryParams) {
    return this.getItems<FollowUpOption>('follow-ups', params);
  },
};
