export interface PreflightCheck {
  label: string;
  passed: boolean;
  details: string;
}

export interface AvailableUpdate {
  version: string;
  release_date: string;
  min_php: string;
  has_migrations: boolean;
  summary: string;
  changelog: string[];
  is_update_available: boolean;
}

export interface UpdateStatusResponse {
  current_version: string;
  available_update: AvailableUpdate | null;
  preflight: {
    ready: boolean;
    checks: PreflightCheck[];
  };
}

export interface SystemUpdateHistory {
  id: number;
  version_from: string;
  version_to: string;
  status: 'checking' | 'backing_up' | 'updating' | 'migrating' | 'verifying' | 'completed' | 'failed';
  backup_reference: string | null;
  release_notes: string | null;
  error_details: string | null;
  started_by: number | null;
  initiator?: {
    id: number;
    name: string;
    email: string;
  };
  started_at: string;
  completed_at: string | null;
  created_at: string;
}
