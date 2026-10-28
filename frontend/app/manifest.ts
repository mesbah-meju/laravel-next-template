import type { MetadataRoute } from 'next';
import { getPublicSeoSettings } from '@/lib/seo';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getPublicSeoSettings();
  const name = settings.seo_brand_name || settings.site_name || 'Laravel Next Starter';

  return {
    name,
    short_name: name.slice(0, 12),
    description: settings.seo_default_description || settings.site_description || 'Laravel + Next.js starter',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#0f172a',
    icons: [
      {
        src: settings.site_favicon || '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
