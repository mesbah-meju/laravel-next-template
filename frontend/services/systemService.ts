import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { SystemHealthData, QueueJobsResponse, FailedJobDetail } from '@/types/system';

export const systemService = {
  async getHealth(): Promise<ApiResponse<SystemHealthData>> {
    const res = await apiClient.get<ApiResponse<SystemHealthData>>('/api/v1/admin/system/health');
    return res.data;
  },

  async getJobs(params?: {
    search?: string;
    queue?: string;
    page?: number;
    per_page?: number;
  }): Promise<QueueJobsResponse> {
    const res = await apiClient.get<QueueJobsResponse>('/api/v1/admin/system/jobs', {
      params,
    });
    return res.data;
  },

  async getJobDetail(id: string | number): Promise<ApiResponse<FailedJobDetail>> {
    const res = await apiClient.get<ApiResponse<FailedJobDetail>>(`/api/v1/admin/system/jobs/${id}`);
    return res.data;
  },

  async retryJob(id: string | number): Promise<ApiResponse<null>> {
    const res = await apiClient.post<ApiResponse<null>>(`/api/v1/admin/system/jobs/${id}/retry`);
    return res.data;
  },

  async retryAllJobs(): Promise<ApiResponse<null>> {
    const res = await apiClient.post<ApiResponse<null>>('/api/v1/admin/system/jobs/retry-all');
    return res.data;
  },

  async deleteJob(id: string | number): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>(`/api/v1/admin/system/jobs/${id}`);
    return res.data;
  },

  async flushAllJobs(): Promise<ApiResponse<null>> {
    const res = await apiClient.delete<ApiResponse<null>>('/api/v1/admin/system/jobs/clear/all');
    return res.data;
  },
};
