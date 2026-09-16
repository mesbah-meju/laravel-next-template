import apiClient from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { SystemNotice, SystemNoticeFormData } from '@/types/systemNotice';

export const systemNoticeService = {
  getNotices(page = 1, perPage = 15) {
    return apiClient
      .get<PaginatedResponse<SystemNotice>>('/api/v1/admin/system/notices', {
        params: { page, per_page: perPage },
      })
      .then((res) => res.data);
  },

  getActiveNotices() {
    return apiClient
      .get<ApiResponse<SystemNotice[]>>('/api/v1/admin/system/notices/active')
      .then((res) => res.data);
  },

  getNotice(id: number) {
    return apiClient
      .get<ApiResponse<SystemNotice>>(`/api/v1/admin/system/notices/${id}`)
      .then((res) => res.data);
  },

  createNotice(data: SystemNoticeFormData) {
    return apiClient
      .post<ApiResponse<SystemNotice>>('/api/v1/admin/system/notices', data)
      .then((res) => res.data);
  },

  updateNotice(id: number, data: SystemNoticeFormData) {
    return apiClient
      .put<ApiResponse<SystemNotice>>(`/api/v1/admin/system/notices/${id}`, data)
      .then((res) => res.data);
  },

  deleteNotice(id: number) {
    return apiClient
      .delete<ApiResponse<null>>(`/api/v1/admin/system/notices/${id}`)
      .then((res) => res.data);
  },
};
