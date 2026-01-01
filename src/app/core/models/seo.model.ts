/**
 * SEO Metadata Model
 * Defines the structure for all SEO-related metadata
 */

export interface SeoMetadata {
  title: string;                    // Page title (50-60 chars ideal)
  description: string;              // Meta description (150-160 chars)
  keywords?: string[];              // Optional keywords (less important for SEO now)
  author?: string;                  // Content author
  canonical?: string;               // Canonical URL (prevent duplicate content)

  // Open Graph (Facebook, LinkedIn)
  ogType?: 'website' | 'article' | 'product';
  ogTitle?: string;                 // Defaults to title if not provided
  ogDescription?: string;           // Defaults to description
  ogImage?: string;                 // Social share image URL
  ogUrl?: string;                   // Page URL

  // Twitter Cards
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;             // @username of site
  twitterCreator?: string;          // @username of content creator
  twitterTitle?: string;            // Defaults to title
  twitterDescription?: string;      // Defaults to description
  twitterImage?: string;            // Twitter image URL

  // Structured Data (JSON-LD)
  structuredData?: StructuredData[];

  // Additional meta tags
  robots?: string;                  // 'index,follow' | 'noindex,nofollow'
  viewport?: string;                // Usually set globally
}

export interface StructuredData {
  '@context': string;               // Usually 'https://schema.org'
  '@type': string;                  // Schema type (Organization, FAQPage, Product, etc.)
  [key: string]: any;               // Schema-specific properties
}

// Pre-configured structured data types
export interface OrganizationSchema extends StructuredData {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  description?: string;
  foundingDate?: string;
  contactPoint?: ContactPoint[];
  sameAs?: string[];               // Social media URLs
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone: string;
  contactType: string;
  email?: string;
  availableLanguage?: string[];
}

export interface FAQPageSchema extends StructuredData {
  '@type': 'FAQPage';
  mainEntity: FAQItem[];
}

export interface FAQItem {
  '@type': 'Question';
  name: string;
  acceptedAnswer: {
    '@type': 'Answer';
    text: string;
  };
}

export interface ProductSchema extends StructuredData {
  '@type': 'Product' | 'SoftwareApplication';
  name: string;
  description: string;
  image?: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers?: Offer[];
  aggregateRating?: AggregateRating;
  applicationCategory?: string;
  operatingSystem?: string;
}

export interface Offer {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability?: string;
  url?: string;
  priceValidUntil?: string;
}

export interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: string;
  reviewCount: string;
}

export interface BreadcrumbListSchema extends StructuredData {
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

export interface ItemListSchema extends StructuredData {
  '@type': 'ItemList';
  itemListElement: ListItem[];
}

export interface ListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  description?: string;
}
