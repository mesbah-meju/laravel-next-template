import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types/api';

export interface TrafficDayStat {
  date: string;
  pageviews: number;
  unique_visitors: number;
}

export interface TrafficSummary {
  total_pageviews: number;
  total_unique_visitors: number;
  today: { pageviews: number; unique_visitors: number };
  yesterday: { pageviews: number; unique_visitors: number };
  last_7_days: { pageviews: number; unique_visitors: number };
  series: TrafficDayStat[];
  tracked_since: string | null;
  pending_live?: { pageviews: number; unique_visitors: number };
  updated_at: string;
}

export const trafficService = {
  async getSummary(days = 30): Promise<ApiResponse<TrafficSummary>> {
    const res = await apiClient.get<ApiResponse<TrafficSummary>>('/api/v1/admin/system/traffic', {
      params: { days },
    });
    return res.data;
  },

  async reset(): Promise<ApiResponse<null>> {
    const res = await apiClient.delete('/api/v1/admin/system/traffic');
    return res.data;
  },
};
