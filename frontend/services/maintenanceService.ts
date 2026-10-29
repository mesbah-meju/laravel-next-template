import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';

export interface MaintenanceWindowRecord {
  id: number;
  starts_at: string;
  ends_at: string | null;
  message: string | null;
  status: string;
  enable_task_id: number | null;
  disable_task_id: number | null;
  created_by: number | null;
  creator?: { id: number; name: string; email: string };
}

export interface MaintenanceStatus {
  maintenance_mode: boolean;
  maintenance_message: string | null;
  manual_override_at: string | null;
  windows: MaintenanceWindowRecord[];
}

export const maintenanceService = {
  async getStatus(): Promise<ApiResponse<MaintenanceStatus>> {
    const res = await apiClient.get<ApiResponse<MaintenanceStatus>>('/api/v1/admin/system/maintenance');
    return res.data;
  },

  async toggle(payload: {
    enabled: boolean;
    message?: string;
    clear_schedules?: boolean;
  }): Promise<ApiResponse<Partial<MaintenanceStatus>>> {
    const res = await apiClient.post('/api/v1/admin/system/maintenance/toggle', payload);
    return res.data;
  },

  async scheduleWindow(payload: {
    starts_at: string;
    ends_at?: string | null;
    message: string;
    timezone?: string;
  }): Promise<ApiResponse<MaintenanceWindowRecord>> {
    const res = await apiClient.post('/api/v1/admin/system/maintenance/windows', payload);
    return res.data;
  },

  async cancelWindow(id: number): Promise<ApiResponse<MaintenanceWindowRecord>> {
    const res = await apiClient.post(`/api/v1/admin/system/maintenance/windows/${id}/cancel`);
    return res.data;
  },
};
