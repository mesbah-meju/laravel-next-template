import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { Menu, MenuItem } from '@/types/menu';

export interface CreateMenuPayload {
  name: string;
  location?: string | null;
  status: 'active' | 'inactive';
  items?: MenuItem[];
}

export interface UpdateMenuPayload {
  name: string;
  location?: string | null;
  status: 'active' | 'inactive';
  items?: MenuItem[];
}

export const menuService = {
  // Public Endpoint
  async getPublicMenu(location: string): Promise<ApiResponse<{ location: string; items: MenuItem[] }>> {
    const response = await apiClient.get<ApiResponse<{ location: string; items: MenuItem[] }>>(
      `/api/v1/public/menus/${location}`
    );
    return response.data;
  },

  // Admin Endpoints
  async getAdminMenus(search?: string): Promise<ApiResponse<Menu[]>> {
    const response = await apiClient.get<ApiResponse<Menu[]>>('/api/v1/admin/menus', {
      params: search ? { search } : undefined,
    });
    return response.data;
  },

  async getAdminMenu(id: number | string): Promise<ApiResponse<Menu>> {
    const response = await apiClient.get<ApiResponse<Menu>>(`/api/v1/admin/menus/${id}`);
    return response.data;
  },

  async createAdminMenu(payload: CreateMenuPayload): Promise<ApiResponse<Menu>> {
    const response = await apiClient.post<ApiResponse<Menu>>('/api/v1/admin/menus', payload);
    return response.data;
  },

  async updateAdminMenu(id: number | string, payload: UpdateMenuPayload): Promise<ApiResponse<Menu>> {
    const response = await apiClient.put<ApiResponse<Menu>>(`/api/v1/admin/menus/${id}`, payload);
    return response.data;
  },

  async deleteAdminMenu(id: number | string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/api/v1/admin/menus/${id}`);
    return response.data;
  },
};
