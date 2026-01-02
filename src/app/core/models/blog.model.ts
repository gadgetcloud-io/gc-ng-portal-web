/**
 * Blog Post Models
 *
 * TypeScript interfaces for blog posts and related entities
 */

export interface BlogAuthor {
  name: string;
  avatar?: string;
  role?: string;
}

export interface BlogCategory {
  name: string;
  slug: string;
}

export interface BlogSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogImage?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  featuredImage: string;
  featuredImageAlt: string;
  author: BlogAuthor;
  category: BlogCategory;
  tags: string[];
  publishedAt: string;
  updatedAt?: string;
  readTime: number;  // Minutes
  featured: boolean;
  seo: BlogSEO;
}

export interface CategoryInfo {
  name: string;
  slug: string;
  count: number;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  categories: CategoryInfo[];
  tags: string[];
}

export interface BlogFilters {
  search?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
  page: number;
  limit: number;
  sort: 'latest' | 'oldest' | 'popular';
}
