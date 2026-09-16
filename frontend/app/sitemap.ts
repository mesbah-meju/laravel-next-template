import { MetadataRoute } from 'next';
import { getPublicSeoSettings } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getPublicSeoSettings();
  const siteUrl = settings.seo_canonical_base_url || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${apiUrl}/api/v1/public/sitemap`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        return json.data.map((item: { url: string; last_modified?: string; change_frequency?: string; priority?: number }) => ({
          url: item.url,
          lastModified: item.last_modified ? new Date(item.last_modified) : new Date(),
          changeFrequency: (item.change_frequency as 'daily' | 'weekly' | 'monthly' | 'always' | 'hourly' | 'yearly' | 'never') || 'weekly',
          priority: item.priority ?? 0.7,
        }));
      }
    }
  } catch {
    // Fallback if backend API is not yet reachable
  }

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
