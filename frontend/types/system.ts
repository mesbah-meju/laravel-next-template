export interface HealthCheckItem {
  name: string;
  version?: string;
  driver?: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface SystemHealthData {
  status: 'healthy' | 'warning' | 'error';
  checks: Record<string, HealthCheckItem>;
  timestamp: string;
}

export interface FailedJobItem {
  id: number | string;
  uuid: string;
  connection: string;
  queue: string;
  display_name: string;
  exception_summary: string;
  failed_at: string;
}

export interface FailedJobDetail {
  id: number | string;
  uuid: string;
  connection: string;
  queue: string;
  display_name: string;
  payload: Record<string, unknown>;
  exception: string;
  failed_at: string;
}

export interface QueueJobsResponse {
  success: boolean;
  message: string;
  data: FailedJobItem[];
  stats: {
    pending_jobs: number;
    failed_jobs: number;
    queue_driver: string;
  };
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    has_more: boolean;
  };
}
