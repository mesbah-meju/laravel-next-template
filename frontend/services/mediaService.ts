import apiClient from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { MediaItem } from '@/types/media';

export interface MediaFilterParams {
  search?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export const mediaService = {
  async getMedia(params?: MediaFilterParams): Promise<PaginatedResponse<MediaItem>> {
    const response = await apiClient.get<PaginatedResponse<MediaItem>>('/api/v1/admin/media', { params });
    return response.data;
  },

  async uploadMedia(file: File): Promise<ApiResponse<MediaItem>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<MediaItem>>('/api/v1/admin/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async uploadMultipleMedia(files: File[]): Promise<ApiResponse<MediaItem[]>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files[]', file);
    });

    const response = await apiClient.post<ApiResponse<MediaItem[]>>('/api/v1/admin/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteMedia(id: number | string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/api/v1/admin/media/${id}`);
    return response.data;
  },
};
