import { MetadataRoute } from 'next';
import { getSiteUrl, isIndexingAllowedByEnv } from '@/lib/env';
import { getPublicSeoSettings, isSeoFlagEnabled } from '@/lib/seo';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getPublicSeoSettings();
  const siteUrl = (settings.seo_canonical_base_url || getSiteUrl()).replace(/\/$/, '');
  const indexingEnabled =
    isSeoFlagEnabled(settings.seo_indexing_enabled, true) &&
    isIndexingAllowedByEnv() &&
    !isSeoFlagEnabled(settings.maintenance_mode, false);

  if (!indexingEnabled) {
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
          '/admin/',
          '/admin-login',
          '/login',
          '/forgot-password',
          '/reset-password',
          '/install',
          '/install/',
          '/api/',
          '/sanctum/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
