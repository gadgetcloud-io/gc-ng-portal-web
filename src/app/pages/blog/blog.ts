import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BlogService } from '../../core/services/blog.service';
import { BlogPost, CategoryInfo, BlogFilters } from '../../core/models/blog.model';
import { SeoService } from '../../core/services/seo.service';
import { BlogCardComponent } from '../../shared/components/blog-card/blog-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ButtonComponent } from '../../shared/components/button/button';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BlogCardComponent,
    PaginationComponent,
    ButtonComponent
  ],
  templateUrl: './blog.html',
  styleUrl: './blog.scss'
})
export class BlogComponent implements OnInit, OnDestroy {
  // Use observables with async pipe for automatic change detection
  posts$: Observable<BlogPost[]>;
  categories$: Observable<CategoryInfo[]>;
  tags$: Observable<string[]>;
  total$: Observable<number>;
  loading$: Observable<boolean>;

  // Filters
  filters: BlogFilters = {
    search: '',
    category: '',
    tag: '',
    page: 1,
    limit: 10,
    sort: 'latest'
  };

  // Pagination
  currentPage = 1;
  totalPages = 1;

  constructor(
    private blogService: BlogService,
    private seoService: SeoService,
    private router: Router
  ) {
    // Assign observables from service
    this.posts$ = this.blogService.posts$;
    this.categories$ = this.blogService.categories$;
    this.tags$ = this.blogService.tags$;
    this.total$ = this.blogService.total$;
    this.loading$ = this.blogService.loading$;
  }

  ngOnInit(): void {
    // Set SEO metadata
    this.seoService.updateMetadata({
      title: 'News & Updates | GadgetCloud',
      description: 'Stay up to date with the latest news, features, product updates, and insights from GadgetCloud.',
      keywords: ['gadgetcloud news', 'product updates', 'announcements', 'blog', 'device management tips'],
      canonical: 'https://www.gadgetcloud.io/blog',
      ogType: 'website',
      ogImage: 'https://www.gadgetcloud.io/assets/og-blog.png',
      ogUrl: 'https://www.gadgetcloud.io/blog'
    });

    // Subscribe to total for pagination calculation
    this.total$.subscribe(total => {
      this.totalPages = Math.ceil(total / this.filters.limit);
    });

    // Load initial posts
    this.loadPosts();
  }

  ngOnDestroy(): void {
    this.blogService.resetFilters();
  }

  loadPosts(): void {
    this.blogService.loadPosts(this.filters).subscribe({
      error: (error) => {
        console.error('Failed to load blog posts:', error);
      }
    });
  }

  onSearchChange(search: string): void {
    this.filters.search = search;
    this.filters.page = 1;
    this.currentPage = 1;
    this.loadPosts();
  }

  onCategoryChange(categorySlug: string): void {
    this.filters.category = categorySlug;
    this.filters.page = 1;
    this.currentPage = 1;
    this.loadPosts();
  }

  onTagChange(tag: string): void {
    this.filters.tag = tag;
    this.filters.page = 1;
    this.currentPage = 1;
    this.loadPosts();
  }

  onSortChange(sort: 'latest' | 'oldest' | 'popular'): void {
    this.filters.sort = sort;
    this.filters.page = 1;
    this.currentPage = 1;
    this.loadPosts();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.currentPage = page;
    this.loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      category: '',
      tag: '',
      page: 1,
      limit: 10,
      sort: 'latest'
    };
    this.currentPage = 1;
    this.loadPosts();
  }

  viewPost(post: BlogPost): void {
    this.router.navigate(['/blog', post.slug]);
  }

  get hasFilters(): boolean {
    return !!(this.filters.search || this.filters.category || this.filters.tag);
  }
}
