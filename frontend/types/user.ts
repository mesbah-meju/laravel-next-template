export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
  created_at?: string;
}

export interface Permission {
  id: number;
  name: string;
  created_at?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  avatar?: string | null;
  created_at?: string;
  last_login_at?: string | null;
  roles?: string[] | Role[];
  permissions?: string[] | Permission[];
}
