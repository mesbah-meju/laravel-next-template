import { MetadataRoute } from 'next';
import { getPublicSeoSettings } from '@/lib/seo';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSeoSettings();
  const siteUrl = settings.seo_canonical_base_url || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const isIndexingDisabled = settings.seo_indexing_enabled === '0' || settings.seo_indexing_enabled === false;
  const isDev = process.env.NODE_ENV !== 'production';

  if (isIndexingDisabled || isDev) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/admin-login',
          '/forgot-password',
          '/reset-password',
          '/api/*',
          '/_next/*',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
