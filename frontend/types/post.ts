export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  status: PostStatus;
  published_at: string | null;
  scheduled_for: string | null;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_image: string | null;
  noindex: boolean;
  author_id: number | null;
  author?: { id: number; name: string; email?: string };
  created_at: string;
  updated_at: string;
}
