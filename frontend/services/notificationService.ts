import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { AppNotification, NotificationResponse } from '@/types/notification';

export const notificationService = {
  async getNotifications(params?: {
    status?: 'all' | 'unread' | 'read';
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<NotificationResponse> {
    const res = await apiClient.get<NotificationResponse>('/api/v1/admin/notifications', {
      params,
    });
    return res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<{ unread_count: number }>>('/api/v1/admin/notifications/unread-count');
    return res.data.data?.unread_count ?? 0;
  },

  async markAsRead(id: string): Promise<{ unread_count: number }> {
    const res = await apiClient.patch<ApiResponse<{ unread_count: number }>>(`/api/v1/admin/notifications/${id}/read`);
    return res.data.data!;
  },

  async markAllAsRead(): Promise<{ unread_count: number }> {
    const res = await apiClient.post<ApiResponse<{ unread_count: number }>>('/api/v1/admin/notifications/mark-all-read');
    return res.data.data!;
  },

  async deleteNotification(id: string): Promise<{ unread_count: number }> {
    const res = await apiClient.delete<ApiResponse<{ unread_count: number }>>(`/api/v1/admin/notifications/${id}`);
    return res.data.data!;
  },

  async clearAll(): Promise<{ unread_count: number }> {
    const res = await apiClient.delete<ApiResponse<{ unread_count: number }>>('/api/v1/admin/notifications/clear/all');
    return res.data.data!;
  },
};
