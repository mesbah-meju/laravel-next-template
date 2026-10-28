import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { User } from '@/types/user';

export interface ImpersonateResponse {
  token: string;
  user: User;
  original_admin?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface StopImpersonationResponse {
  token?: string;
  user: User;
}

export const impersonationService = {
  async start(userId: number): Promise<ImpersonateResponse> {
    const res = await apiClient.post<ApiResponse<ImpersonateResponse>>(
      `/api/v1/admin/impersonate/${userId}`
    );
    if (res.data?.data) {
      const data = res.data.data;
      const existingAdmin = localStorage.getItem('auth_user');
      if (existingAdmin && !localStorage.getItem('impersonation_original_admin')) {
        localStorage.setItem('impersonation_original_admin', existingAdmin);
      }
      localStorage.setItem('impersonation_active', 'true');
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return data;
    }
    throw new Error(res.data?.message || 'Failed to start impersonation');
  },

  async stop(): Promise<StopImpersonationResponse> {
    const res = await apiClient.post<ApiResponse<StopImpersonationResponse>>(
      '/api/v1/admin/impersonate/stop/session'
    );
    if (res.data?.data) {
      const data = res.data.data;
      localStorage.removeItem('impersonation_active');
      localStorage.removeItem('impersonation_original_admin');
      // Session restore may omit token; only overwrite when backend returns one.
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      } else {
        localStorage.removeItem('auth_token');
      }
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return data;
    }
    throw new Error(res.data?.message || 'Failed to stop impersonation');
  },

  isImpersonating(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('impersonation_active') === 'true';
  },

  getOriginalAdmin(): { id: number; name: string; email: string } | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('impersonation_original_admin');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
