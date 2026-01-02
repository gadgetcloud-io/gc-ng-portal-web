import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  BlogPost,
  BlogListResponse,
  BlogFilters,
  CategoryInfo
} from '../models/blog.model';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private postsSubject = new BehaviorSubject<BlogPost[]>([]);
  private categoriesSubject = new BehaviorSubject<CategoryInfo[]>([]);
  private tagsSubject = new BehaviorSubject<string[]>([]);
  private totalSubject = new BehaviorSubject<number>(0);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  posts$ = this.postsSubject.asObservable();
  categories$ = this.categoriesSubject.asObservable();
  tags$ = this.tagsSubject.asObservable();
  total$ = this.totalSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Load blog posts with filters
   */
  loadPosts(filters: BlogFilters): Observable<BlogListResponse> {
    this.loadingSubject.next(true);

    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.featured !== undefined) params.set('featured', String(filters.featured));
    params.set('page', String(filters.page));
    params.set('limit', String(filters.limit));
    params.set('sort', filters.sort);

    const queryString = params.toString();
    const url = `/blog${queryString ? '?' + queryString : ''}`;

    return this.apiService.get<BlogListResponse>(url).pipe(
      tap(response => {
        this.postsSubject.next(response.posts);
        this.categoriesSubject.next(response.categories);
        this.tagsSubject.next(response.tags);
        this.totalSubject.next(response.total);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        console.error('Failed to load blog posts:', error);
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Get single blog post by slug
   */
  getPostBySlug(slug: string): Observable<BlogPost> {
    return this.apiService.get<BlogPost>(`/blog/${slug}`);
  }

  /**
   * Get featured posts for homepage
   */
  getFeaturedPosts(limit: number = 3): Observable<BlogPost[]> {
    return this.apiService.get<BlogPost[]>(`/blog/featured?limit=${limit}`);
  }

  /**
   * Reset filters
   */
  resetFilters(): void {
    this.postsSubject.next([]);
    this.categoriesSubject.next([]);
    this.tagsSubject.next([]);
    this.totalSubject.next(0);
  }
}
