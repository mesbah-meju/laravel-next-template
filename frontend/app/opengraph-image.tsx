import { ImageResponse } from 'next/og';
import { getPublicSeoSettings } from '@/lib/seo';

export const runtime = 'edge';
export const alt = 'Site Open Graph image';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const settings = await getPublicSeoSettings();
  const siteName = settings.seo_brand_name || settings.site_name || 'Laravel Next Starter';
  const description =
    settings.seo_default_description ||
    settings.site_description ||
    'Production-ready Laravel API + Next.js starter';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 55%, #0f172a 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#93c5fd',
          }}
        >
          {siteName}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 900 }}>
            Build production admin systems faster.
          </div>
          <div style={{ display: 'flex', fontSize: 28, lineHeight: 1.4, color: '#cbd5e1', maxWidth: 860 }}>
            {description.slice(0, 140)}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
