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

export const impersonationService = {
  async start(userId: number): Promise<ImpersonateResponse> {
    const res = await apiClient.post<ApiResponse<ImpersonateResponse>>(
      `/api/v1/admin/impersonate/${userId}`
    );
    if (res.data?.data) {
      const data = res.data.data;
      // Save original admin details before switching token
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

  async stop(): Promise<{ token: string; user: User }> {
    const res = await apiClient.post<ApiResponse<{ token: string; user: User }>>(
      '/api/v1/admin/impersonate/stop/session'
    );
    if (res.data?.data) {
      const data = res.data.data;
      localStorage.removeItem('impersonation_active');
      localStorage.removeItem('impersonation_original_admin');
      localStorage.setItem('auth_token', data.token);
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
