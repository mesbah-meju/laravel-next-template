import api from '@/lib/api';

export interface RedirectItem {
  id: number;
  source_path: string;
  target_path: string;
  status_code: 301 | 302;
  is_active: boolean;
  hit_count: number;
  last_hit_at: string | null;
  created_at: string;
  updated_at: string;
}

export const redirectService = {
  getRedirects: async (page = 1, perPage = 20): Promise<{ success: boolean; data: RedirectItem[]; pagination: { total: number } }> => {
    const res = await api.get(`/api/v1/admin/settings/redirects?page=${page}&per_page=${perPage}`);
    return res.data;
  },

  createRedirect: async (data: Partial<RedirectItem>): Promise<{ success: boolean; data: RedirectItem; message: string }> => {
    const res = await api.post('/api/v1/admin/settings/redirects', data);
    return res.data;
  },

  updateRedirect: async (id: number, data: Partial<RedirectItem>): Promise<{ success: boolean; data: RedirectItem; message: string }> => {
    const res = await api.put(`/api/v1/admin/settings/redirects/${id}`, data);
    return res.data;
  },

  deleteRedirect: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/api/v1/admin/settings/redirects/${id}`);
    return res.data;
  },
};
