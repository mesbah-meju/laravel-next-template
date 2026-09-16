export interface LogEntry {
  id: number;
  timestamp: string;
  environment: string;
  severity: 'EMERGENCY' | 'ALERT' | 'CRITICAL' | 'ERROR' | 'WARNING' | 'NOTICE' | 'INFO' | 'DEBUG' | string;
  message: string;
  stack_trace: string | null;
}

export interface LogFileInfo {
  filename: string;
  size_bytes: number;
  modified_at: string;
}

export interface LogViewerResponse {
  entries: LogEntry[];
  pagination: {
    total: number;
    current_page: number;
    per_page: number;
    total_pages: number;
  };
  files: LogFileInfo[];
}
