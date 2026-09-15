import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { SiteSettings } from '@/types/setting';

export const settingService = {
  // Public Endpoint
  async getPublicSettings(): Promise<ApiResponse<SiteSettings>> {
    const response = await apiClient.get<ApiResponse<SiteSettings>>('/api/v1/public/settings');
    return response.data;
  },

  // Admin Endpoints
  async getAdminSettings(): Promise<ApiResponse<SiteSettings>> {
    const response = await apiClient.get<ApiResponse<SiteSettings>>('/api/v1/admin/settings');
    return response.data;
  },

  async updateAdminSettings(settings: Record<string, unknown>): Promise<ApiResponse<SiteSettings>> {
    const response = await apiClient.post<ApiResponse<SiteSettings>>('/api/v1/admin/settings', { settings });
    return response.data;
  },
};
