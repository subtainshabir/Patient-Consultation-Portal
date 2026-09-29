import { api } from './api';
import type {
  Consultation,
  ConsultationCreatePayload,
  ConsultationSummary,
  ConsultationListResponse,
  ConsultationReport,
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

  async generateReport(consultationId: string, regenerate: boolean = false): Promise<ConsultationReport> {
    return api.post<ConsultationReport>(`/consultations/${consultationId}/report?regenerate=${regenerate}`);
  },

  async getReportMetadata(consultationId: string): Promise<ConsultationReport> {
    return api.get<ConsultationReport>(`/consultations/${consultationId}/report`);
  },

  async getReportPdfBlob(consultationId: string, version?: number): Promise<Blob> {
    const url = version
      ? `/consultations/${consultationId}/report/preview?version=${version}`
      : `/consultations/${consultationId}/report/preview`;
    return api.getBlob(url);
  },

  async downloadReportPdf(consultationId: string, fileName: string, version?: number): Promise<void> {
    const url = version
      ? `/consultations/${consultationId}/report/download?version=${version}`
      : `/consultations/${consultationId}/report/download`;
    const blob = await api.getBlob(url);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },

  async listConsultationReports(consultationId: string): Promise<ConsultationReport[]> {
    return api.get<ConsultationReport[]>(`/consultations/${consultationId}/reports`);
  },

  async getAllConsultations(params?: {
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<ConsultationListResponse> {
    const search = params?.search ? encodeURIComponent(params.search) : '';
    const page = params?.page || 1;
    const pageSize = params?.page_size || 20;
    const query = `?search=${search}&page=${page}&page_size=${pageSize}`;
    return api.get<ConsultationListResponse>(`/consultations${query}`);
  },
};
