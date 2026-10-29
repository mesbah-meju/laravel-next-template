import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { getBackendUrl, getSiteUrl } from '@/lib/env';
import { buildPageMetadata, toAbsoluteUrl } from '@/lib/seo';
import { Post } from '@/types/post';

export const revalidate = 60;

async function fetchPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/api/v1/public/posts/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60, tags: ['posts', `post:${slug}`] },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: 'Post not found' };

  return buildPageMetadata({
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    canonical: post.canonical_url || `/blog/${post.slug}`,
    noindex: post.noindex,
    ogType: 'article',
    ogImage: post.og_image || undefined,
    publishedTime: post.published_at || undefined,
    modifiedTime: post.updated_at,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const base = getSiteUrl().replace(/\/$/, '');

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd
        schema={{
          type: 'BlogPosting',
          headline: post.title,
          description: post.meta_description || post.excerpt || '',
          datePublished: post.published_at || post.created_at,
          dateModified: post.updated_at,
          authorName: post.author?.name || 'Editorial',
          publisherName: 'Laravel Next Starter',
          image: post.og_image ? toAbsoluteUrl(post.og_image, base) : undefined,
        }}
      />

      <header className="space-y-3 border-b border-border pb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        {post.published_at && (
          <p className="text-xs text-muted-foreground">
            {new Date(post.published_at).toLocaleDateString()}
            {post.author?.name ? ` · ${post.author.name}` : ''}
          </p>
        )}
        {post.excerpt && (
          <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        )}
      </header>

      <div
        className="prose prose-sm dark:prose-invert mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: post.body || '' }}
      />
    </article>
  );
}
