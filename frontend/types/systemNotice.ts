export type NoticeType = 'info' | 'warning' | 'critical' | 'maintenance';
export type NoticePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SystemNotice {
  id: number;
  uuid: string;
  created_by?: number;
  title: string;
  message: string;
  type: NoticeType;
  priority: NoticePriority;
  start_at?: string | null;
  end_at?: string | null;
  is_active: boolean;
  dismissible: boolean;
  target_roles?: string[] | null;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface SystemNoticeFormData {
  title: string;
  message: string;
  type: NoticeType;
  priority: NoticePriority;
  start_at?: string;
  end_at?: string;
  is_active: boolean;
  dismissible: boolean;
  target_roles?: string[];
  [key: string]: unknown;
}
