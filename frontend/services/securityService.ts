import { apiClient } from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { LoginHistoryItem, LoginHistoryFilters, UserSession } from '@/types/security';

export const securityService = {
  async getLoginHistory(params?: LoginHistoryFilters): Promise<PaginatedResponse<LoginHistoryItem>> {
    const res = await apiClient.get<PaginatedResponse<LoginHistoryItem>>('/api/v1/admin/security/login-history', {
      params,
    });
    return res.data;
  },

  async getActiveSessions(): Promise<ApiResponse<UserSession[]>> {
    const res = await apiClient.get<ApiResponse<UserSession[]>>('/api/v1/admin/security/sessions');
    return res.data;
  },

  async terminateSession(sessionId: string): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>(`/api/v1/admin/security/sessions/${sessionId}`);
    return res.data;
  },

  async logoutOtherSessions(password: string): Promise<ApiResponse<{ terminated_count: number }>> {
    const res = await apiClient.post<ApiResponse<{ terminated_count: number }>>(
      '/api/v1/admin/security/sessions/logout-others',
      { password }
    );
    return res.data;
  },
};
