import apiClient from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export interface ScheduledTaskRecord {
  id: number;
  type: string;
  name: string | null;
  payload: Record<string, unknown> | null;
  run_at: string;
  timezone: string;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_by: number | null;
  creator?: { id: number; name: string; email: string };
  created_at: string;
}

export const scheduledTaskService = {
  async list(params?: Record<string, unknown>): Promise<PaginatedResponse<ScheduledTaskRecord>> {
    const res = await apiClient.get('/api/v1/admin/system/scheduled-tasks', { params });
    return res.data;
  },

  async cancel(id: number): Promise<ApiResponse<ScheduledTaskRecord>> {
    const res = await apiClient.post(`/api/v1/admin/system/scheduled-tasks/${id}/cancel`);
    return res.data;
  },
};
