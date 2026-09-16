import api from '@/lib/api';
import { Backup, BackupEnvironmentStatus } from '@/types/backup';

export interface BackupListResponse {
  success: boolean;
  data: Backup[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    has_more: boolean;
  };
  meta?: {
    environment: BackupEnvironmentStatus;
  };
}

export const backupService = {
  getBackups: async (page = 1, perPage = 15): Promise<BackupListResponse> => {
    const res = await api.get(`/api/v1/admin/system/backups?page=${page}&per_page=${perPage}`);
    return res.data;
  },

  createBackup: async (): Promise<{ success: boolean; data: Backup; message: string }> => {
    const res = await api.post('/api/v1/admin/system/backups');
    return res.data;
  },

  downloadBackup: async (backup: Backup): Promise<void> => {
    const response = await api.get(`/api/v1/admin/system/backups/${backup.id}/download`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', backup.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteBackup: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/api/v1/admin/system/backups/${id}`);
    return res.data;
  },
};
