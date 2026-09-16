import api from '@/lib/api';

export interface CacheAction {
  key: 'application' | 'config' | 'route' | 'view' | 'all';
  label: string;
  description: string;
  danger: boolean;
  command: string;
}

export interface CacheStatusResponse {
  driver: string;
  actions: CacheAction[];
}

export const cacheService = {
  getStatus: async (): Promise<{ success: boolean; data: CacheStatusResponse }> => {
    const res = await api.get('/api/v1/admin/system/cache');
    return res.data;
  },

  clearCache: async (action: string): Promise<{ success: boolean; message: string; data: { action: string; output: string } }> => {
    const res = await api.post('/api/v1/admin/system/cache/clear', { action });
    return res.data;
  },
};
