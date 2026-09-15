import apiClient from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { User, UserStatus } from '@/types/user';

export interface UserFilterParams {
  search?: string;
  status?: string;
  role?: string;
  page?: number;
  per_page?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  status: UserStatus;
  avatar?: string | null;
  roles?: string[];
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  password?: string;
  status: UserStatus;
  avatar?: string | null;
  roles?: string[];
}

export const userService = {
  async getUsers(params?: UserFilterParams): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User>>('/api/v1/admin/users', { params });
    return response.data;
  },

  async getUser(id: number | string): Promise<ApiResponse<User>> {
    const response = await apiClient.get<ApiResponse<User>>(`/api/v1/admin/users/${id}`);
    return response.data;
  },

  async createUser(payload: CreateUserPayload): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/api/v1/admin/users', payload);
    return response.data;
  },

  async updateUser(id: number | string, payload: UpdateUserPayload): Promise<ApiResponse<User>> {
    const response = await apiClient.put<ApiResponse<User>>(`/api/v1/admin/users/${id}`, payload);
    return response.data;
  },

  async toggleStatus(id: number | string, status: UserStatus): Promise<ApiResponse<User>> {
    const response = await apiClient.patch<ApiResponse<User>>(`/api/v1/admin/users/${id}/status`, { status });
    return response.data;
  },

  async deleteUser(id: number | string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/api/v1/admin/users/${id}`);
    return response.data;
  },
};
