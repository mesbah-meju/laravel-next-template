import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { User } from '@/types/user';

export interface LoginPayload {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginResponse {
  user: User;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  avatar?: string | null;
}

export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', payload);
    return response.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/api/v1/auth/logout');
    return response.data;
  },

  async getUser(): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/api/v1/auth/user');
    return response.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<ApiResponse<{ user: User }>> {
    const response = await apiClient.put<ApiResponse<{ user: User }>>('/api/v1/auth/profile', payload);
    return response.data;
  },

  async updatePassword(payload: UpdatePasswordPayload): Promise<ApiResponse<null>> {
    const response = await apiClient.put<ApiResponse<null>>('/api/v1/auth/password', payload);
    return response.data;
  },

  async forgotPassword(email: string): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/api/v1/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(payload: Record<string, string>): Promise<ApiResponse<null>> {
    const response = await apiClient.post<ApiResponse<null>>('/api/v1/auth/reset-password', payload);
    return response.data;
  },
};
