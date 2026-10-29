import apiClient from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import { Post } from '@/types/post';

export const postService = {
  async getAdminPosts(params?: Record<string, unknown>): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get('/api/v1/admin/posts', { params });
    return res.data;
  },

  async getAdminPost(id: number): Promise<ApiResponse<Post>> {
    const res = await apiClient.get(`/api/v1/admin/posts/${id}`);
    return res.data;
  },

  async create(payload: Partial<Post>): Promise<ApiResponse<Post>> {
    const res = await apiClient.post('/api/v1/admin/posts', payload);
    return res.data;
  },

  async update(id: number, payload: Partial<Post>): Promise<ApiResponse<Post>> {
    const res = await apiClient.put(`/api/v1/admin/posts/${id}`, payload);
    return res.data;
  },

  async remove(id: number): Promise<ApiResponse<null>> {
    const res = await apiClient.delete(`/api/v1/admin/posts/${id}`);
    return res.data;
  },

  async schedule(id: number, scheduled_for: string, timezone?: string): Promise<ApiResponse<Post>> {
    const res = await apiClient.post(`/api/v1/admin/posts/${id}/schedule`, { scheduled_for, timezone });
    return res.data;
  },

  async unschedule(id: number): Promise<ApiResponse<Post>> {
    const res = await apiClient.post(`/api/v1/admin/posts/${id}/unschedule`);
    return res.data;
  },

  async publish(id: number): Promise<ApiResponse<Post>> {
    const res = await apiClient.post(`/api/v1/admin/posts/${id}/publish`);
    return res.data;
  },

  async archive(id: number): Promise<ApiResponse<Post>> {
    const res = await apiClient.post(`/api/v1/admin/posts/${id}/archive`);
    return res.data;
  },

  async getPublicPosts(params?: Record<string, unknown>): Promise<PaginatedResponse<Post>> {
    const res = await apiClient.get('/api/v1/public/posts', { params });
    return res.data;
  },

  async getPublicPost(slug: string): Promise<ApiResponse<Post>> {
    const res = await apiClient.get(`/api/v1/public/posts/${slug}`);
    return res.data;
  },
};
