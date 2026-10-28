export interface PreflightCheck {
  label: string;
  passed: boolean;
  details: string;
  informative?: boolean;
}

export interface PendingMigration {
  name: string;
}

export interface PendingPermissions {
  missing: string[];
  role_sync_needed: boolean;
  missing_roles: string[];
}

export interface PendingSettings {
  missing_keys: string[];
}

export interface PendingSeeder {
  id: string;
  class: string;
  reason: string;
}

export interface PendingUpdates {
  has_updates: boolean;
  migrations: PendingMigration[];
  permissions: PendingPermissions;
  settings: PendingSettings;
  seeders: PendingSeeder[];
  summary: string;
  changelog: string[];
  counts: {
    migrations: number;
    permissions: number;
    settings: number;
    seeders: number;
  };
}

export interface AvailableUpdate {
  version: string;
  release_date: string;
  min_php: string;
  has_migrations: boolean;
  summary: string;
  changelog: string[];
  is_update_available: boolean;
  source?: 'local-detection' | 'manifest' | string;
  pending?: PendingUpdates;
}

export interface UpdateStatusResponse {
  current_version: string;
  pending: PendingUpdates;
  available_update: AvailableUpdate | null;
  preflight: {
    ready: boolean;
    environment_ready?: boolean;
    has_pending_work?: boolean;
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

export type UpdateComponent = 'migrations' | 'permissions' | 'settings';
