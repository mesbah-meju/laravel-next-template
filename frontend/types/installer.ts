export interface InstallerStatus {
  is_installed: boolean;
  app_version: string;
  app_name: string;
}

export interface ExtensionCheck {
  extension: string;
  label: string;
  passed: boolean;
  required: boolean;
}

export interface PermissionCheck {
  path: string;
  passed: boolean;
}

export interface RequirementsResponse {
  is_ready: boolean;
  php_version: {
    current: string;
    required: string;
    passed: boolean;
  };
  extensions: ExtensionCheck[];
  permissions: PermissionCheck[];
}

export interface InstallerEnvironmentPayload {
  app_name: string;
  app_url: string;
  app_env: 'production' | 'local' | 'staging';
  app_timezone: string;
  app_locale: string;
  db_connection: 'mysql' | 'sqlite' | 'pgsql';
  db_host?: string;
  db_port?: number;
  db_database: string;
  db_username?: string;
  db_password?: string;
}
