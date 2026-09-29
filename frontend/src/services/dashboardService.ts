import { api } from './api';
import type {
  AdminDashboardData,
  DoctorDashboardData,
  StaffDashboardData,
} from '../types/dashboard';

export const dashboardService = {
  /**
   * Fetches real-time system, master data, user stats, and recent system activities
   * specifically for the Administrator Dashboard.
   */
  async getAdminDashboard(): Promise<AdminDashboardData> {
    return api.get<AdminDashboardData>('/admin/dashboard');
  },

  /**
   * Fetches real-time clinical statistics, today's consultations, recent patients,
   * and recent consultation workflows for the Doctor Dashboard.
   */
  async getDoctorDashboard(): Promise<DoctorDashboardData> {
    return api.get<DoctorDashboardData>('/doctor/dashboard');
  },

  /**
   * Fetches real-time patient registration metrics, today's registrations,
   * and non-clinical patient activity for the Staff Dashboard.
   */
  async getStaffDashboard(): Promise<StaffDashboardData> {
    return api.get<StaffDashboardData>('/staff/dashboard');
  },
};
