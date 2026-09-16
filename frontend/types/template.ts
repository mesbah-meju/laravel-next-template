export interface EmailTemplate {
  id: number;
  key: string;
  name: string;
  subject: string;
  html_content: string;
  plain_content: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: number;
  key: string;
  name: string;
  title: string;
  message: string;
  channels: ('database' | 'email' | 'sms' | 'push')[];
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplatePreviewResponse {
  template: EmailTemplate;
  sample_data: Record<string, string>;
  rendered_subject: string;
  rendered_html: string;
  rendered_plain: string | null;
}

export interface NotificationTemplatePreviewResponse {
  template: NotificationTemplate;
  sample_data: Record<string, string>;
  rendered_title: string;
  rendered_message: string;
}
