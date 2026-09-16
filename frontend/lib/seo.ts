import { Metadata } from 'next';

export interface SeoConfigOptions {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  ogImageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
}

export interface PublicSiteSettings {
  site_name?: string;
  site_description?: string;
  seo_default_title?: string;
  seo_title_separator?: string;
  seo_title_template?: string;
  seo_default_description?: string;
  seo_default_keywords?: string;
  seo_canonical_base_url?: string;
  seo_default_og_image?: string;
  seo_brand_name?: string;
  seo_indexing_enabled?: string | boolean;
  seo_google_site_verification?: string;
  seo_bing_site_verification?: string;
  site_favicon?: string;
  site_logo?: string;
}

/**
 * Fetch public settings safely with cached fallback.
 */
export async function getPublicSeoSettings(): Promise<PublicSiteSettings> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${apiUrl}/api/v1/public/settings`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      return data?.data || {};
    }
  } catch {
    // Fallback if backend is booting
  }

  return {
    site_name: 'NextLaravel Enterprise Starter',
    site_description: 'Modular Next.js + Laravel 12 Enterprise Foundation',
    seo_title_separator: '|',
    seo_indexing_enabled: '1',
  };
}

/**
 * Construct production-grade Next.js App Router Metadata.
 */
export async function buildPageMetadata(options: SeoConfigOptions = {}): Promise<Metadata> {
  const settings = await getPublicSeoSettings();

  const siteName = settings.seo_brand_name || settings.site_name || 'Laravel + Next.js';
  const titleSeparator = settings.seo_title_separator || '|';
  const defaultTitle = settings.seo_default_title || settings.site_name || 'NextLaravel Starter';
  const defaultDesc = settings.seo_default_description || settings.site_description || 'Production ready starter template.';
  const baseUrl = settings.seo_canonical_base_url || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const title = options.title ? `${options.title} ${titleSeparator} ${siteName}` : defaultTitle;
  const description = options.description || defaultDesc;
  const canonicalUrl = options.canonical ? `${baseUrl.replace(/\/$/, '')}/${options.canonical.replace(/^\//, '')}` : baseUrl;
  const ogImageUrl = options.ogImage || settings.seo_default_og_image || settings.site_logo || `${baseUrl}/og-image.png`;

  // Respect global indexing toggle & explicit page noindex & dev safety
  const isGlobalIndexingDisabled = settings.seo_indexing_enabled === '0' || settings.seo_indexing_enabled === false;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const shouldNoIndex = options.noindex || isGlobalIndexingDisabled || isDevelopment;

  const metadata: Metadata = {
    title: options.title
      ? {
          default: options.title,
          template: `%s ${titleSeparator} ${siteName}`,
        }
      : {
          default: defaultTitle,
          template: `%s ${titleSeparator} ${siteName}`,
        },
    description,
    keywords: options.keywords || (settings.seo_default_keywords ? settings.seo_default_keywords.split(',') : undefined),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: shouldNoIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
    openGraph: {
      type: options.ogType || 'website',
      locale: 'en_US',
      url: canonicalUrl,
      title: options.title || defaultTitle,
      description,
      siteName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: options.ogImageAlt || title,
        },
      ],
      ...(options.publishedTime && { publishedTime: options.publishedTime }),
      ...(options.modifiedTime && { modifiedTime: options.modifiedTime }),
      ...(options.authors && { authors: options.authors }),
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title || defaultTitle,
      description,
      images: [ogImageUrl],
    },
    verification: {
      google: settings.seo_google_site_verification || undefined,
      other: settings.seo_bing_site_verification ? { 'msvalidate.01': settings.seo_bing_site_verification } : undefined,
    },
  };

  return metadata;
}
