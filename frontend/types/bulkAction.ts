export interface BulkActionItem {
  key: string;
  label: string;
  danger?: boolean;
  requires_confirmation?: boolean;
}

export interface BulkActionResult {
  processed: number;
  successful: number;
  failed: number;
  errors?: string[];
}
