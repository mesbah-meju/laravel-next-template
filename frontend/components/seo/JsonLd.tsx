/**
 * Server-Component JSON-LD helper.
 * Do NOT use next/script here — that mounts a client-managed <script>
 * and triggers React 19 removeChild crashes during navigation/HMR.
 */

export interface OrganizationSchema {
  type: 'Organization';
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
}

export interface WebSiteSchema {
  type: 'WebSite';
  name: string;
  url: string;
  searchUrlTemplate?: string;
}

export interface WebPageSchema {
  type: 'WebPage';
  name: string;
  description: string;
  url: string;
  breadcrumb?: {
    name: string;
    url: string;
  }[];
}

export interface ArticleSchema {
  type: 'Article' | 'BlogPosting';
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  publisherName: string;
  publisherLogo?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqPageSchema {
  type: 'FAQPage';
  items: FaqItem[];
}

export type StructuredDataSchema =
  | OrganizationSchema
  | WebSiteSchema
  | WebPageSchema
  | ArticleSchema
  | FaqPageSchema;

export function buildJsonLd(schema: StructuredDataSchema): Record<string, unknown> {
  let jsonLdObject: Record<string, unknown> = {
    '@context': 'https://schema.org',
  };

  switch (schema.type) {
    case 'Organization':
      jsonLdObject = {
        ...jsonLdObject,
        '@type': 'Organization',
        name: schema.name,
        url: schema.url,
        ...(schema.logo && { logo: schema.logo }),
        ...(schema.sameAs && schema.sameAs.length > 0 && { sameAs: schema.sameAs }),
        ...(schema.contactPoint && {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: schema.contactPoint.telephone,
            contactType: schema.contactPoint.contactType || 'customer service',
            email: schema.contactPoint.email,
          },
        }),
      };
      break;

    case 'WebSite':
      jsonLdObject = {
        ...jsonLdObject,
        '@type': 'WebSite',
        name: schema.name,
        url: schema.url,
        ...(schema.searchUrlTemplate && {
          potentialAction: {
            '@type': 'SearchAction',
            target: schema.searchUrlTemplate,
            'query-input': 'required name=search_term_string',
          },
        }),
      };
      break;

    case 'WebPage':
      jsonLdObject = {
        ...jsonLdObject,
        '@type': 'WebPage',
        name: schema.name,
        description: schema.description,
        url: schema.url,
        ...(schema.breadcrumb && {
          breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: schema.breadcrumb.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              item: item.url,
            })),
          },
        }),
      };
      break;

    case 'Article':
    case 'BlogPosting':
      jsonLdObject = {
        ...jsonLdObject,
        '@type': schema.type,
        headline: schema.headline,
        description: schema.description,
        datePublished: schema.datePublished,
        ...(schema.dateModified && { dateModified: schema.dateModified }),
        ...(schema.image && { image: schema.image }),
        author: {
          '@type': 'Person',
          name: schema.authorName,
        },
        publisher: {
          '@type': 'Organization',
          name: schema.publisherName,
          ...(schema.publisherLogo && {
            logo: {
              '@type': 'ImageObject',
              url: schema.publisherLogo,
            },
          }),
        },
      };
      break;

    case 'FAQPage':
      jsonLdObject = {
        ...jsonLdObject,
        '@type': 'FAQPage',
        mainEntity: schema.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      };
      break;
  }

  return jsonLdObject;
}

/**
 * Renders JSON-LD for Server Components only.
 * React 19 hoists this into <head>; keep it out of Client Components.
 */
export function JsonLd({ schema }: { schema: StructuredDataSchema }) {
  const payload = JSON.stringify(buildJsonLd(schema)).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
