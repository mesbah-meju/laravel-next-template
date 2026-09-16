import { apiClient } from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { ActivityLog, ActivityLogFilters } from '@/types/activityLog';

export const activityLogService = {
  async getLogs(params?: ActivityLogFilters): Promise<PaginatedResponse<ActivityLog>> {
    const res = await apiClient.get<PaginatedResponse<ActivityLog>>('/api/v1/admin/activity-logs', {
      params,
    });
    return res.data;
  },

  async getLog(id: number): Promise<ApiResponse<ActivityLog>> {
    const res = await apiClient.get<ApiResponse<ActivityLog>>(`/api/v1/admin/activity-logs/${id}`);
    return res.data;
  },

  async getModules(): Promise<ApiResponse<string[]>> {
    const res = await apiClient.get<ApiResponse<string[]>>('/api/v1/admin/activity-logs/modules');
    return res.data;
  },

  async clearLogs(days?: number): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>('/api/v1/admin/activity-logs/clear', {
      params: { days },
    });
    return res.data;
  },
};
