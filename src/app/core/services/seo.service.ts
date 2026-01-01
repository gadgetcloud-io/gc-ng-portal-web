/**
 * SEO Service
 * Manages all SEO-related metadata updates using Angular's Title and Meta services
 * Works with CSR by updating meta tags dynamically on route changes
 */

import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SeoMetadata, StructuredData } from '../models/seo.model';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly defaultTitle = 'GadgetCloud - Smart Device & Warranty Management';
  private readonly defaultDescription = 'Track warranties, store documents, and manage all your gadgets in one secure place. Never miss a warranty expiration again.';
  private readonly defaultImage = 'https://www.gadgetcloud.io/assets/og-image.png';
  private readonly siteUrl = 'https://www.gadgetcloud.io';
  private readonly twitterHandle = '@gadgetcloud_io';

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Update all SEO metadata for a page
   * Call this in ngOnInit of each page component
   */
  updateMetadata(metadata: Partial<SeoMetadata>): void {
    const fullMetadata = this.buildFullMetadata(metadata);

    this.updateTitle(fullMetadata.title);
    this.updateMetaTags(fullMetadata);
    this.updateOpenGraphTags(fullMetadata);
    this.updateTwitterCardTags(fullMetadata);
    this.updateCanonicalUrl(fullMetadata.canonical);

    if (fullMetadata.structuredData) {
      this.updateStructuredData(fullMetadata.structuredData);
    }
  }

  /**
   * Build complete metadata with defaults
   */
  private buildFullMetadata(partial: Partial<SeoMetadata>): SeoMetadata {
    return {
      title: partial.title || this.defaultTitle,
      description: partial.description || this.defaultDescription,
      keywords: partial.keywords || [],
      author: partial.author || 'GadgetCloud Team',
      canonical: partial.canonical,
      ogType: partial.ogType || 'website',
      ogTitle: partial.ogTitle || partial.title || this.defaultTitle,
      ogDescription: partial.ogDescription || partial.description || this.defaultDescription,
      ogImage: partial.ogImage || this.defaultImage,
      ogUrl: partial.ogUrl || this.siteUrl,
      twitterCard: partial.twitterCard || 'summary_large_image',
      twitterSite: partial.twitterSite || this.twitterHandle,
      twitterCreator: partial.twitterCreator || this.twitterHandle,
      twitterTitle: partial.twitterTitle || partial.title || this.defaultTitle,
      twitterDescription: partial.twitterDescription || partial.description || this.defaultDescription,
      twitterImage: partial.twitterImage || partial.ogImage || this.defaultImage,
      structuredData: partial.structuredData,
      robots: partial.robots || 'index,follow'
    };
  }

  /**
   * Update page title
   */
  private updateTitle(title: string): void {
    this.titleService.setTitle(title);
  }

  /**
   * Update standard meta tags
   */
  private updateMetaTags(metadata: SeoMetadata): void {
    this.metaService.updateTag({ name: 'description', content: metadata.description });

    if (metadata.keywords && metadata.keywords.length > 0) {
      this.metaService.updateTag({ name: 'keywords', content: metadata.keywords.join(', ') });
    }

    this.metaService.updateTag({ name: 'author', content: metadata.author || 'GadgetCloud Team' });
    this.metaService.updateTag({ name: 'robots', content: metadata.robots || 'index,follow' });
  }

  /**
   * Update Open Graph tags for social sharing
   */
  private updateOpenGraphTags(metadata: SeoMetadata): void {
    this.metaService.updateTag({ property: 'og:type', content: metadata.ogType || 'website' });
    this.metaService.updateTag({ property: 'og:title', content: metadata.ogTitle || '' });
    this.metaService.updateTag({ property: 'og:description', content: metadata.ogDescription || '' });
    this.metaService.updateTag({ property: 'og:image', content: metadata.ogImage || '' });
    this.metaService.updateTag({ property: 'og:url', content: metadata.ogUrl || '' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'GadgetCloud' });
  }

  /**
   * Update Twitter Card tags
   */
  private updateTwitterCardTags(metadata: SeoMetadata): void {
    this.metaService.updateTag({ name: 'twitter:card', content: metadata.twitterCard || 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:site', content: metadata.twitterSite || '' });
    this.metaService.updateTag({ name: 'twitter:creator', content: metadata.twitterCreator || '' });
    this.metaService.updateTag({ name: 'twitter:title', content: metadata.twitterTitle || '' });
    this.metaService.updateTag({ name: 'twitter:description', content: metadata.twitterDescription || '' });
    this.metaService.updateTag({ name: 'twitter:image', content: metadata.twitterImage || '' });
  }

  /**
   * Update canonical URL to prevent duplicate content issues
   */
  private updateCanonicalUrl(url?: string): void {
    // Remove existing canonical link
    const existingCanonical = this.document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link if URL provided
    if (url) {
      const link: HTMLLinkElement = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  /**
   * Update structured data (JSON-LD)
   * Injects schema.org markup for rich search results
   */
  private updateStructuredData(data: StructuredData[]): void {
    // Remove existing structured data scripts
    const existingScripts = this.document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());

    // Add new structured data
    data.forEach(schema => {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema);
      this.document.head.appendChild(script);
    });
  }

  /**
   * Helper: Create Organization schema
   * Use on homepage and about page
   */
  createOrganizationSchema(): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'GadgetCloud',
      url: 'https://www.gadgetcloud.io',
      logo: 'https://www.gadgetcloud.io/assets/logo.png',
      description: 'Smart device and warranty management platform',
      foundingDate: '2024',
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91-555-123-4567',
          contactType: 'Customer Support',
          email: 'hello@gadgetcloud.io',
          availableLanguage: ['English']
        }
      ],
      sameAs: [
        'https://twitter.com/gadgetcloud_io',
        'https://linkedin.com/company/gadgetcloud',
        'https://github.com/gadgetcloud-io'
      ]
    };
  }

  /**
   * Helper: Create FAQ schema from FAQ array
   * Use on pricing and contact pages
   */
  createFAQSchema(faqs: Array<{ question: string; answer: string }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Helper: Create Product/SoftwareApplication schema
   * Use on pricing page for each plan
   */
  createProductSchema(plan: {
    name: string;
    description: string;
    price: string;
    features: string[];
  }): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `GadgetCloud ${plan.name} Plan`,
      description: plan.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: {
        '@type': 'Offer',
        price: plan.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'https://www.gadgetcloud.io/pricing'
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '250'
      }
    };
  }

  /**
   * Helper: Create Breadcrumb schema
   * Use on all pages for navigation context
   */
  createBreadcrumbSchema(items: Array<{ name: string; url?: string }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  /**
   * Helper: Create ItemList schema for features list
   * Use on features page
   */
  createItemListSchema(items: Array<{ title: string; description: string }>): StructuredData {
    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.title,
        description: item.description
      }))
    };
  }
}
