export interface SiteSettings {
  site_name?: string;
  site_description?: string;
  site_logo?: string;
  site_favicon?: string;
  site_email?: string;
  site_phone?: string;
  site_address?: string;
  footer_text?: string;
  timezone?: string;
  default_meta_title?: string;
  default_meta_description?: string;
  social_links?: Record<string, string>;
  [key: string]: unknown;
}
