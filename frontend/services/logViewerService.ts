import api from '@/lib/api';
import { LogViewerResponse } from '@/types/logViewer';

export interface LogViewerParams {
  file?: string;
  severity?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export const logViewerService = {
  getLogs: async (params: LogViewerParams = {}): Promise<{ success: boolean; data: LogViewerResponse }> => {
    const query = new URLSearchParams();
    if (params.file) query.set('file', params.file);
    if (params.severity) query.set('severity', params.severity);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.per_page) query.set('per_page', params.per_page.toString());

    const res = await api.get(`/api/v1/admin/system/logs?${query.toString()}`);
    return res.data;
  },

  downloadLog: async (file?: string): Promise<void> => {
    const url = `/api/v1/admin/system/logs/download${file ? `?file=${file}` : ''}`;
    const response = await api.get(url, { responseType: 'blob' });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', file || 'laravel.log');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  clearLog: async (file?: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/api/v1/admin/system/logs/clear${file ? `?file=${file}` : ''}`);
    return res.data;
  },
};
