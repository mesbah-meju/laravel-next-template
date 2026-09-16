import apiClient from '@/lib/api';
import { ApiResponse } from '@/types/api';
import { BulkActionItem, BulkActionResult } from '@/types/bulkAction';

export const bulkActionService = {
  getAvailableActions(resource: string) {
    return apiClient
      .get<ApiResponse<BulkActionItem[]>>(`/api/v1/admin/bulk-actions/${resource}`)
      .then((res) => res.data);
  },

  execute(resource: string, action: string, ids: (string | number)[], payload?: Record<string, any>) {
    return apiClient
      .post<ApiResponse<BulkActionResult>>(`/api/v1/admin/bulk-actions/${resource}`, {
        action,
        ids,
        payload,
      })
      .then((res) => res.data);
  },
};
