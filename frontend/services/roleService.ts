import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { Permission, Role } from '@/types/user';

export interface CreateRolePayload {
  name: string;
  permissions?: string[];
}

export interface UpdateRolePayload {
  name: string;
  permissions?: string[];
}

export const roleService = {
  async getRoles(): Promise<ApiResponse<Role[]>> {
    const response = await apiClient.get<ApiResponse<Role[]>>('/api/v1/admin/roles');
    return response.data;
  },

  async getRole(id: number | string): Promise<ApiResponse<Role>> {
    const response = await apiClient.get<ApiResponse<Role>>(`/api/v1/admin/roles/${id}`);
    return response.data;
  },

  async createRole(payload: CreateRolePayload): Promise<ApiResponse<Role>> {
    const response = await apiClient.post<ApiResponse<Role>>('/api/v1/admin/roles', payload);
    return response.data;
  },

  async updateRole(id: number | string, payload: UpdateRolePayload): Promise<ApiResponse<Role>> {
    const response = await apiClient.put<ApiResponse<Role>>(`/api/v1/admin/roles/${id}`, payload);
    return response.data;
  },

  async deleteRole(id: number | string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/api/v1/admin/roles/${id}`);
    return response.data;
  },

  async getPermissions(): Promise<ApiResponse<Permission[]>> {
    const response = await apiClient.get<ApiResponse<Permission[]>>('/api/v1/admin/permissions');
    return response.data;
  },
};
