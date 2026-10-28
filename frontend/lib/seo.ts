import { Metadata } from 'next';
import {
  getBackendUrl,
  getSiteUrl,
  isIndexingAllowedByEnv,
  joinSiteUrl,
  toAbsoluteUrl,
} from '@/lib/env';

export interface SeoConfigOptions {
  title?: string;
  description?: string;
  /** Path only, e.g. `/about` or `about`. Omit for homepage. */
  canonical?: string;
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  ogImageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
  /** Root layout only — emits title.default + title.template. */
  root?: boolean;
}

export interface PublicSiteSettings {
  site_name?: string;
  site_description?: string;
  site_email?: string;
  site_phone?: string;
  site_address?: string;
  social_links?: Record<string, string> | string;
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
  seo_structured_data_enabled?: string | boolean;
  site_favicon?: string;
  site_logo?: string;
  maintenance_mode?: string | boolean;
  maintenance_message?: string;
}

export function isSeoFlagEnabled(value: string | boolean | null | undefined, defaultValue = true): boolean {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'off', 'no'].includes(normalized)) return false;
  if (['1', 'true', 'on', 'yes'].includes(normalized)) return true;
  return defaultValue;
}

export function parseSocialLinks(value: PublicSiteSettings['social_links']): Record<string, string> {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Fetch public settings safely with cached fallback.
 */
export async function getPublicSeoSettings(): Promise<PublicSiteSettings> {
  const apiUrl = getBackendUrl();

  try {
    const res = await fetch(`${apiUrl}/api/v1/public/settings`, {
      next: { revalidate: 60, tags: ['settings', 'seo'] },
    });

    if (res.ok) {
      const data = await res.json();
      return normalizePublicSeoSettings(data?.data || {});
    }
  } catch {
    // Fallback if backend is booting
  }

  return {
    site_name: 'Laravel Next Starter',
    site_description: 'Production-ready Laravel API and Next.js starter template.',
    seo_title_separator: '|',
    seo_indexing_enabled: '1',
    seo_structured_data_enabled: '1',
  };
}

/** Map legacy default_meta_* keys onto seo_* when SEO fields are empty. */
function normalizePublicSeoSettings(raw: Record<string, unknown>): PublicSiteSettings {
  const settings = { ...raw } as PublicSiteSettings;

  if (!settings.seo_default_title && typeof raw.default_meta_title === 'string') {
    settings.seo_default_title = raw.default_meta_title;
  }
  if (!settings.seo_default_description && typeof raw.default_meta_description === 'string') {
    settings.seo_default_description = raw.default_meta_description;
  }
  if (!settings.seo_title_separator) {
    settings.seo_title_separator = '|';
  }
  if (settings.seo_indexing_enabled === null || settings.seo_indexing_enabled === undefined) {
    settings.seo_indexing_enabled = '1';
  }
  if (settings.seo_structured_data_enabled === null || settings.seo_structured_data_enabled === undefined) {
    settings.seo_structured_data_enabled = '1';
  }

  return settings;
}

function resolveBaseUrl(settings: PublicSiteSettings): string {
  return (settings.seo_canonical_base_url || getSiteUrl()).replace(/\/$/, '');
}

function resolveCanonical(baseUrl: string, path?: string): string {
  if (!path || path === '/') return baseUrl;
  return `${baseUrl}/${path.replace(/^\//, '')}`;
}

/**
 * Construct production-grade Next.js App Router Metadata.
 */
export async function buildPageMetadata(options: SeoConfigOptions = {}): Promise<Metadata> {
  const settings = await getPublicSeoSettings();

  const siteName = settings.seo_brand_name || settings.site_name || 'Laravel + Next.js';
  const titleSeparator = settings.seo_title_separator || '|';
  const defaultTitle = settings.seo_default_title || settings.site_name || 'Laravel Next Starter';
  const defaultDesc =
    settings.seo_default_description ||
    settings.site_description ||
    'Production-ready full-stack starter template.';
  const baseUrl = resolveBaseUrl(settings);

  const pageTitle = options.title;
  const description = options.description || defaultDesc;
  const canonicalUrl = resolveCanonical(baseUrl, options.canonical);
  const ogImageCandidate =
    options.ogImage || settings.seo_default_og_image || settings.site_logo || undefined;
  const ogImageUrl = toAbsoluteUrl(ogImageCandidate, baseUrl) || `${baseUrl}/opengraph-image`;

  const keywords = (
    options.keywords ||
    (settings.seo_default_keywords
      ? settings.seo_default_keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : undefined)
  );

  const isGlobalIndexingDisabled = !isSeoFlagEnabled(settings.seo_indexing_enabled, true);
  const shouldNoIndex = Boolean(options.noindex || isGlobalIndexingDisabled || !isIndexingAllowedByEnv());

  const displayTitle = pageTitle || defaultTitle;
  const favicon = toAbsoluteUrl(settings.site_favicon, baseUrl);

  const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    description,
    applicationName: siteName,
    keywords,
    authors: options.authors?.map((name) => ({ name })),
    creator: siteName,
    publisher: siteName,
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
      title: displayTitle,
      description,
      siteName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: options.ogImageAlt || displayTitle,
        },
      ],
      ...(options.publishedTime && { publishedTime: options.publishedTime }),
      ...(options.modifiedTime && { modifiedTime: options.modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description,
      images: [ogImageUrl],
    },
    verification: {
      google: settings.seo_google_site_verification || undefined,
      other: settings.seo_bing_site_verification
        ? { 'msvalidate.01': settings.seo_bing_site_verification }
        : undefined,
    },
    icons: favicon
      ? {
          icon: favicon,
          shortcut: favicon,
          apple: favicon,
        }
      : undefined,
    category: 'technology',
  };

  if (options.root) {
    metadata.title = {
      default: defaultTitle,
      template: `%s ${titleSeparator} ${siteName}`,
    };
  } else if (pageTitle) {
    // Segment title — root template appends brand once.
    metadata.title = pageTitle;
  }

  return metadata;
}

export function buildOrganizationJsonLd(settings: PublicSiteSettings) {
  const baseUrl = resolveBaseUrl(settings);
  const siteName = settings.seo_brand_name || settings.site_name || 'Laravel Next Starter';
  const logo = toAbsoluteUrl(settings.site_logo || settings.seo_default_og_image, baseUrl);
  const sameAs = Object.values(parseSocialLinks(settings.social_links)).filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    ...(logo && { logo }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(settings.site_email && {
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: settings.site_email,
        ...(settings.site_phone && { telephone: settings.site_phone }),
      },
    }),
  };
}

export function buildWebsiteJsonLd(settings: PublicSiteSettings) {
  const baseUrl = resolveBaseUrl(settings);
  const siteName = settings.seo_brand_name || settings.site_name || 'Laravel Next Starter';

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: baseUrl,
    description: settings.seo_default_description || settings.site_description,
    publisher: {
      '@type': 'Organization',
      name: siteName,
    },
  };
}

export { joinSiteUrl, toAbsoluteUrl };
