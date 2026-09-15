export interface MediaItem {
  id: number;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  size: number;
  path: string;
  url: string;
  created_by?: number | null;
  creator?: {
    id: number;
    name: string;
  } | null;
  created_at: string;
}
