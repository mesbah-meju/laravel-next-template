export interface Backup {
  id: number;
  filename: string;
  disk: string;
  path: string;
  size_bytes: number;
  driver: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_by: number | null;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BackupEnvironmentStatus {
  driver: string;
  is_supported: boolean;
  available: boolean;
  message: string;
  strategy?: string;
  has_binary?: boolean;
  recommended_action?: string | null;
}
