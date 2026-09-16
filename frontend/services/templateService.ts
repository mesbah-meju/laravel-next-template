import api from '@/lib/api';
import {
  EmailTemplate,
  NotificationTemplate,
  EmailTemplatePreviewResponse,
  NotificationTemplatePreviewResponse,
} from '@/types/template';

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export const templateService = {
  // Email Templates
  getEmailTemplates: async (page = 1): Promise<{ success: boolean; data: PaginatedResponse<EmailTemplate> }> => {
    const res = await api.get(`/api/v1/admin/email-templates?page=${page}`);
    return res.data;
  },

  getEmailTemplate: async (id: number): Promise<{ success: boolean; data: EmailTemplate }> => {
    const res = await api.get(`/api/v1/admin/email-templates/${id}`);
    return res.data;
  },

  updateEmailTemplate: async (
    id: number,
    data: Partial<EmailTemplate>
  ): Promise<{ success: boolean; data: EmailTemplate; message: string }> => {
    const res = await api.put(`/api/v1/admin/email-templates/${id}`, data);
    return res.data;
  },

  previewEmailTemplate: async (id: number): Promise<{ success: boolean; data: EmailTemplatePreviewResponse }> => {
    const res = await api.get(`/api/v1/admin/email-templates/${id}/preview`);
    return res.data;
  },

  sendTestEmail: async (id: number, email: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/api/v1/admin/email-templates/${id}/test`, { email });
    return res.data;
  },

  // Notification Templates
  getNotificationTemplates: async (page = 1): Promise<{ success: boolean; data: PaginatedResponse<NotificationTemplate> }> => {
    const res = await api.get(`/api/v1/admin/notification-templates?page=${page}`);
    return res.data;
  },

  getNotificationTemplate: async (id: number): Promise<{ success: boolean; data: NotificationTemplate }> => {
    const res = await api.get(`/api/v1/admin/notification-templates/${id}`);
    return res.data;
  },

  updateNotificationTemplate: async (
    id: number,
    data: Partial<NotificationTemplate>
  ): Promise<{ success: boolean; data: NotificationTemplate; message: string }> => {
    const res = await api.put(`/api/v1/admin/notification-templates/${id}`, data);
    return res.data;
  },

  previewNotificationTemplate: async (
    id: number
  ): Promise<{ success: boolean; data: NotificationTemplatePreviewResponse }> => {
    const res = await api.get(`/api/v1/admin/notification-templates/${id}/preview`);
    return res.data;
  },

  sendTestNotification: async (id: number): Promise<{ success: boolean; message: string }> => {
    const res = await api.post(`/api/v1/admin/notification-templates/${id}/test`);
    return res.data;
  },
};
