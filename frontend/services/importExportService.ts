import apiClient from '@/lib/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';
import {
  ImporterDefinition,
  ExporterDefinition,
  ImportRecord,
  ImportUploadResponse,
  PreviewMappingResponse,
} from '@/types/importExport';

export const importExportService = {
  getImporters() {
    return apiClient
      .get<ApiResponse<ImporterDefinition[]>>('/api/v1/admin/import-export/importers')
      .then((res) => res.data);
  },

  getExporters() {
    return apiClient
      .get<ApiResponse<ExporterDefinition[]>>('/api/v1/admin/import-export/exporters')
      .then((res) => res.data);
  },

  uploadFile(importableType: string, file: File) {
    const formData = new FormData();
    formData.append('importable_type', importableType);
    formData.append('file', file);

    return apiClient
      .post<ApiResponse<ImportUploadResponse>>('/api/v1/admin/import-export/upload', formData)
      .then((res) => res.data);
  },

  previewMapping(uuid: string, columnMapping: Record<string, string>) {
    return apiClient
      .post<ApiResponse<PreviewMappingResponse>>(`/api/v1/admin/import-export/${uuid}/preview`, {
        column_mapping: columnMapping,
      })
      .then((res) => res.data);
  },

  processImport(uuid: string, columnMapping: Record<string, string>, options?: Record<string, any>) {
    return apiClient
      .post<ApiResponse<ImportRecord>>(`/api/v1/admin/import-export/${uuid}/process`, {
        column_mapping: columnMapping,
        options,
      })
      .then((res) => res.data);
  },

  getProgress(uuid: string) {
    return apiClient
      .get<ApiResponse<ImportRecord>>(`/api/v1/admin/import-export/${uuid}/progress`)
      .then((res) => res.data);
  },

  getHistory(page = 1, perPage = 15) {
    return apiClient
      .get<PaginatedResponse<ImportRecord>>('/api/v1/admin/import-export/history', {
        params: { page, per_page: perPage },
      })
      .then((res) => res.data);
  },

  async exportCsv(exportKey: string, options?: { selected_ids?: number[]; search?: string; sort_by?: string; sort_direction?: string; filename?: string }) {
    const response = await apiClient.post(
      `/api/v1/admin/import-export/export/${exportKey}`,
      options,
      { responseType: 'blob' }
    );

    const filename = options?.filename || `${exportKey}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  async downloadErrorLog(uuid: string) {
    const response = await apiClient.get(`/api/v1/admin/import-export/${uuid}/errors`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `import_failures_${uuid}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};
