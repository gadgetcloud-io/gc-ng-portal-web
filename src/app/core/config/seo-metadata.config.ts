/**
 * SEO Metadata Configuration
 * Centralized repository of SEO content for all pages
 */

import { SeoMetadata } from '../models/seo.model';

export const SEO_CONFIG: Record<string, Partial<SeoMetadata>> = {
  home: {
    title: 'GadgetCloud - Smart Device & Warranty Management',
    description: 'Track warranties, store documents, and manage all your gadgets in one secure place. Never miss a warranty expiration again. Free for up to 5 devices.',
    keywords: ['device management', 'warranty tracking', 'gadget organizer', 'receipt storage', 'warranty reminder', 'device inventory'],
    canonical: 'https://www.gadgetcloud.io',
    ogType: 'website',
    ogImage: 'https://www.gadgetcloud.io/assets/og-home.png',
    ogUrl: 'https://www.gadgetcloud.io',
    twitterCard: 'summary_large_image'
  },

  features: {
    title: 'Features - Device Management Made Simple | GadgetCloud',
    description: 'Discover GadgetCloud features: device inventory, document management, smart reminders, team collaboration, and enterprise security. Free trial available.',
    keywords: ['device features', 'warranty features', 'document storage', 'cloud backup', 'team collaboration', 'device tracking'],
    canonical: 'https://www.gadgetcloud.io/features',
    ogType: 'website',
    ogImage: 'https://www.gadgetcloud.io/assets/og-features.png',
    ogUrl: 'https://www.gadgetcloud.io/features'
  },

  pricing: {
    title: 'Pricing Plans - Free to Enterprise | GadgetCloud',
    description: 'Choose the perfect plan: Free (5 devices), Pro ($9/mo, 50 devices), or Business ($29/mo, unlimited). 14-day free trial. No credit card required.',
    keywords: ['gadgetcloud pricing', 'device management pricing', 'warranty tracking cost', 'free plan', 'business plan'],
    canonical: 'https://www.gadgetcloud.io/pricing',
    ogType: 'website',
    ogImage: 'https://www.gadgetcloud.io/assets/og-pricing.png',
    ogUrl: 'https://www.gadgetcloud.io/pricing'
  },

  about: {
    title: 'About Us - Our Mission & Team | GadgetCloud',
    description: 'Founded in 2024, GadgetCloud helps 10,000+ users manage 50,000+ devices. Learn about our mission to simplify gadget management for everyone.',
    keywords: ['about gadgetcloud', 'company mission', 'team', 'warranty management company', 'device tracking platform'],
    canonical: 'https://www.gadgetcloud.io/about',
    ogType: 'website',
    ogImage: 'https://www.gadgetcloud.io/assets/og-about.png',
    ogUrl: 'https://www.gadgetcloud.io/about'
  },

  contact: {
    title: 'Contact Us - Get Help & Support | GadgetCloud',
    description: 'Need help? Email us at hello@gadgetcloud.io or chat with our support team. Monday-Friday 9 AM - 6 PM IST. Response within 24 hours.',
    keywords: ['contact gadgetcloud', 'customer support', 'help center', 'warranty support', 'device management support'],
    canonical: 'https://www.gadgetcloud.io/contact',
    ogType: 'website',
    ogImage: 'https://www.gadgetcloud.io/assets/og-contact.png',
    ogUrl: 'https://www.gadgetcloud.io/contact'
  },

  blog: {
    title: 'News & Updates | GadgetCloud',
    description: 'Stay up to date with the latest news, features, product updates, and insights from GadgetCloud.',
    keywords: ['gadgetcloud news', 'product updates', 'announcements', 'blog', 'device management tips'],
    canonical: 'https://www.gadgetcloud.io/blog',
    ogType: 'website',
    ogImage: 'https://www.gadgetcloud.io/assets/og-blog.png',
    ogUrl: 'https://www.gadgetcloud.io/blog'
  },

  'blog-detail': {
    title: '', // Will be set dynamically by component
    description: '',
    keywords: [],
    canonical: '',
    ogType: 'article',
    twitterCard: 'summary_large_image'
  }
};

// Brand colors for social sharing images (reference)
export const BRAND_COLORS = {
  navy: '#0A1628',
  teal: '#00B4A6',
  coral: '#FF6B6B'
};

// Social media handles
export const SOCIAL_HANDLES = {
  twitter: '@gadgetcloud_io',
  linkedin: 'company/gadgetcloud',
  github: 'gadgetcloud-io'
};
