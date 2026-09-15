import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { User } from '@/types/user';
import { MediaItem } from '@/types/media';

export interface DashboardStats {
  total_users: number;
  active_users: number;
  total_roles: number;
  total_menus: number;
  total_media: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recent_users: User[];
  recent_media: MediaItem[];
}

export const dashboardService = {
  getDashboard() {
    return apiClient
      .get<ApiResponse<DashboardData>>('/api/v1/admin/dashboard')
      .then((res) => res.data);
  },
};
