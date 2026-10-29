import Link from 'next/link';
import { Metadata } from 'next';
import { getBackendUrl } from '@/lib/env';
import { buildPageMetadata } from '@/lib/seo';
import { Post } from '@/types/post';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: 'Blog',
    description: 'News, updates, and articles from our team.',
    canonical: '/blog',
  });
}

async function fetchPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/public/posts?per_page=24`, {
      next: { revalidate: 60, tags: ['posts'] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function BlogIndexPage() {
  const posts = await fetchPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">Blog</h1>
      <p className="mt-2 text-sm text-muted-foreground">Published articles and updates.</p>

      <ul className="mt-10 space-y-8">
        {posts.length === 0 && (
          <li className="text-sm text-muted-foreground">No published posts yet.</li>
        )}
        {posts.map((post) => (
          <li key={post.id} className="border-b border-border pb-8">
            <Link href={`/blog/${post.slug}`} className="group block">
              <h2 className="text-xl font-semibold text-foreground group-hover:text-primary">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              )}
              {post.published_at && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(post.published_at).toLocaleDateString()}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
