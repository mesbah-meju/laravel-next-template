export interface ImportField {
  name: string;
  label: string;
  required?: boolean;
  aliases?: string[];
  type?: string;
  example?: string;
}

export interface ImporterDefinition {
  key: string;
  label: string;
  description?: string;
  permission?: string;
  unique_by?: string;
  duplicate_strategy?: 'skip' | 'update' | 'error';
  fields: ImportField[];
}

export interface ExporterColumn {
  key: string;
  label: string;
}

export interface ExporterDefinition {
  key: string;
  label: string;
  permission?: string;
  columns: ExporterColumn[];
}

export interface ImportRecord {
  id: number;
  uuid: string;
  user_id?: number;
  importable_type: string;
  original_filename: string;
  file_format: string;
  status: 'uploaded' | 'mapping' | 'validating' | 'processing' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled';
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  skipped_rows: number;
  column_mapping?: Record<string, string>;
  options?: Record<string, any>;
  errors_summary?: Array<{
    row: number;
    errors: string[];
    data?: Record<string, any>;
  }>;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ImportUploadResponse {
  import: ImportRecord;
  headers: string[];
  suggested_mapping: Record<string, string>;
  available_fields: ImportField[];
  sample_rows: Array<Record<string, string>>;
  total_rows: number;
}

export interface PreviewMappingResponse {
  headers: string[];
  mapped_rows: Array<Record<string, any>>;
  errors: Record<number, Record<string, string[]>>;
  total_rows_estimate: number;
}
