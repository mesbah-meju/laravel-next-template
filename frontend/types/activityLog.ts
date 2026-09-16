import { User } from './user';

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  event: string | null;
  module: string;
  subject_type: string | null;
  subject_id: number | string | null;
  description: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: User | null;
}

export interface ActivityLogFilters {
  search?: string;
  user_id?: number | string;
  module?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}
