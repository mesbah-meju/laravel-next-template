import { MetadataRoute } from 'next';
import { getBackendUrl, getSiteUrl } from '@/lib/env';
import { getPublicSeoSettings } from '@/lib/seo';

type BackendSitemapItem = {
  url: string;
  last_modified?: string;
  change_frequency?: string;
  priority?: number;
};

function rewriteToSiteHost(url: string, siteUrl: string): string {
  try {
    const parsed = new URL(url);
    const site = new URL(siteUrl);
    parsed.protocol = site.protocol;
    parsed.host = site.host;
    return parsed.toString().replace(/\/$/, '') || siteUrl;
  } catch {
    if (url.startsWith('/')) return `${siteUrl}${url}`;
    return url;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getPublicSeoSettings();
  const siteUrl = (settings.seo_canonical_base_url || getSiteUrl()).replace(/\/$/, '');
  const apiUrl = getBackendUrl();

  try {
    const res = await fetch(`${apiUrl}/api/v1/public/sitemap`, {
      next: { revalidate: 3600, tags: ['sitemap'] },
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        return json.data.map((item: BackendSitemapItem) => ({
          url: rewriteToSiteHost(item.url, siteUrl),
          lastModified: item.last_modified ? new Date(item.last_modified) : new Date(),
          changeFrequency:
            (item.change_frequency as MetadataRoute.Sitemap[number]['changeFrequency']) || 'weekly',
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
