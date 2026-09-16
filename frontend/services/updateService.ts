import api from '@/lib/api';
import {
  UpdateStatusResponse,
  SystemUpdateHistory,
} from '@/types/update';

export const updateService = {
  getStatus: async (): Promise<{ success: boolean; data: UpdateStatusResponse }> => {
    const res = await api.get('/api/v1/admin/system/updates/status');
    return res.data;
  },

  executeUpdate: async (version: string): Promise<{ success: boolean; message: string; data: SystemUpdateHistory }> => {
    const res = await api.post('/api/v1/admin/system/updates/execute', { version });
    return res.data;
  },

  getHistory: async (page = 1, perPage = 15): Promise<{ success: boolean; data: SystemUpdateHistory[]; pagination: { total: number } }> => {
    const res = await api.get(`/api/v1/admin/system/updates/history?page=${page}&per_page=${perPage}`);
    return res.data;
  },
};
