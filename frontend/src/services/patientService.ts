import { api } from './api';
import type {
  Patient,
  PatientFormData,
  PatientListResponse,
  PatientQueryParams,
  DuplicatePatientWarning,
} from '../types/patient';

export const patientService = {
  async getPatients(params: PatientQueryParams = {}): Promise<PatientListResponse> {
    const query = new URLSearchParams();

    if (params.search && params.search.trim()) {
      query.append('search', params.search.trim());
    }
    if (params.page !== undefined) {
      query.append('page', params.page.toString());
    }
    if (params.page_size !== undefined) {
      query.append('page_size', params.page_size.toString());
    }
    if (params.is_active !== undefined && params.is_active !== null) {
      query.append('is_active', params.is_active.toString());
    }
    if (params.gender && params.gender !== 'all') {
      query.append('gender', params.gender);
    }
    if (params.sort_by) {
      query.append('sort_by', params.sort_by);
    }
    if (params.sort_order) {
      query.append('sort_order', params.sort_order);
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/patients?${queryString}` : '/patients';
    return api.get<PatientListResponse>(endpoint);
  },

  async getPatientById(patientId: string): Promise<Patient> {
    return api.get<Patient>(`/patients/${encodeURIComponent(patientId)}`);
  },

  async createPatient(data: PatientFormData): Promise<Patient> {
    return api.post<Patient>('/patients', data);
  },

  async updatePatient(patientId: string, data: Partial<PatientFormData>): Promise<Patient> {
    return api.patch<Patient>(`/patients/${encodeURIComponent(patientId)}`, data);
  },

  async setPatientStatus(patientId: string, isActive: boolean): Promise<Patient> {
    return api.patch<Patient>(`/patients/${encodeURIComponent(patientId)}/status`, {
      is_active: isActive,
    });
  },

  async checkDuplicate(data: PatientFormData): Promise<DuplicatePatientWarning | null> {
    return api.post<DuplicatePatientWarning | null>('/patients/check-duplicate', data);
  },
};
