import { User } from './user';

export interface LoginHistoryItem {
  id: number;
  user_id: number | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device: string | null;
  platform: string | null;
  browser: string | null;
  status: 'successful' | 'failed' | 'throttled' | 'blocked' | string;
  login_at: string;
  user?: User | null;
}

export interface UserSession {
  id: string;
  ip_address: string;
  is_current_device: boolean;
  last_active: string;
  last_active_human: string;
  device: string;
  platform: string;
  browser: string;
}

export interface LoginHistoryFilters {
  search?: string;
  user_id?: number | string;
  status?: string;
  device?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}
