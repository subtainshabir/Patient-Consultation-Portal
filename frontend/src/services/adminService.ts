import { api } from './api';
import type {
  MasterDataCategoryKey,
  MasterDataListResponse,
  MasterDataQueryParams,
} from '../types/masterData';
import type {
  AdminDashboardStats,
  ClinicSetting,
  ClinicSettingUpdate,
} from '../types/admin';

export const adminService = {
  // ─── Dashboard Statistics ───
  async getDashboardStats(): Promise<AdminDashboardStats> {
    return api.get<AdminDashboardStats>('/admin/stats');
  },

  // ─── Master Data Management ───
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
      ? `/admin/${categoryKey}?${queryString}`
      : `/admin/${categoryKey}`;
    return api.get<MasterDataListResponse<T>>(endpoint);
  },

  async getItem<T>(categoryKey: MasterDataCategoryKey, id: number): Promise<T> {
    return api.get<T>(`/admin/${categoryKey}/${id}`);
  },

  async createItem<T>(
    categoryKey: MasterDataCategoryKey,
    data: Record<string, unknown>
  ): Promise<T> {
    return api.post<T>(`/admin/${categoryKey}`, data);
  },

  async updateItem<T>(
    categoryKey: MasterDataCategoryKey,
    id: number,
    data: Record<string, unknown>
  ): Promise<T> {
    return api.patch<T>(`/admin/${categoryKey}/${id}`, data);
  },

  async setItemStatus<T>(
    categoryKey: MasterDataCategoryKey,
    id: number,
    isActive: boolean
  ): Promise<T> {
    return api.patch<T>(`/admin/${categoryKey}/${id}/status`, {
      is_active: isActive,
    });
  },

  // ─── Clinic & Doctor Settings ───
  async getSettings(): Promise<ClinicSetting> {
    return api.get<ClinicSetting>('/admin/settings');
  },

  async updateSettings(data: ClinicSettingUpdate): Promise<ClinicSetting> {
    return api.put<ClinicSetting>('/admin/settings', data);
  },

  async uploadLogo(file: File): Promise<ClinicSetting> {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<ClinicSetting>('/admin/settings/logo', formData);
  },

  async removeLogo(): Promise<ClinicSetting> {
    return api.delete<ClinicSetting>('/admin/settings/logo');
  },

  async getLogoBlobUrl(): Promise<string> {
    const blob = await api.getBlob('/admin/settings/logo');
    return URL.createObjectURL(blob);
  },
};
