export interface MenuItem {
  id?: number | string;
  menu_id?: number;
  parent_id?: number | string | null;
  title: string;
  url?: string | null;
  raw_url?: string | null;
  route?: string | null;
  route_params?: Record<string, unknown> | null;
  new_tab?: boolean;
  icon?: string | null;
  color?: string | null;
  bg_color?: string | null;
  css_class?: string | null;
  order?: number;
  is_active?: boolean;
  children?: MenuItem[];
}

export interface Menu {
  id: number;
  name: string;
  location?: string | null;
  status: 'active' | 'inactive';
  all_items_count?: number;
  items?: MenuItem[];
  created_at?: string;
  updated_at?: string;
}
