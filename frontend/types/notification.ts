export interface NotificationData {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'danger';
  action_url?: string | null;
  action_text?: string | null;
  module?: string;
  icon?: string | null;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: NotificationData;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  data: AppNotification[];
  unread_count: number;
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
    has_more: boolean;
  };
}
