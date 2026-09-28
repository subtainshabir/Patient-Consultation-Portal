import { api } from './api';
import type {
  Consultation,
  ConsultationCreatePayload,
  ConsultationSummary,
  ServerDateResponse,
} from '../types/consultation';

export const consultationService = {
  async getServerDate(): Promise<ServerDateResponse> {
    return api.get<ServerDateResponse>('/consultations/current-date');
  },

  async createConsultation(payload: ConsultationCreatePayload): Promise<Consultation> {
    return api.post<Consultation>('/consultations', payload);
  },

  async updateConsultation(consultationId: string, payload: ConsultationCreatePayload): Promise<Consultation> {
    return api.put<Consultation>(`/consultations/${consultationId}`, payload);
  },

  async getConsultation(consultationId: string): Promise<Consultation> {
    return api.get<Consultation>(`/consultations/${consultationId}`);
  },

  async getPatientConsultations(patientId: string): Promise<ConsultationSummary[]> {
    return api.get<ConsultationSummary[]>(`/patients/${patientId}/consultations`);
  },
};
