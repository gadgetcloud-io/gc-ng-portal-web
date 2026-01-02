import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { switchMap, map, catchError, tap, takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService } from '../../core/services/blog.service';
import { BlogPost } from '../../core/models/blog.model';
import { SeoService } from '../../core/services/seo.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ButtonComponent } from '../../shared/components/button/button';

interface BlogDetailState {
  post: BlogPost | null;
  safeContent: SafeHtml;
  loading: boolean;
  error: boolean;
}

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss'
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  state$!: Observable<BlogDetailState>;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private seoService: SeoService,
    private breadcrumbService: BreadcrumbService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.state$ = this.route.paramMap.pipe(
      switchMap(params => {
        const slug = params.get('slug');
        if (!slug) {
          return of({ post: null, safeContent: '', loading: false, error: true });
        }

        // Return loading state immediately
        return this.blogService.getPostBySlug(slug).pipe(
          map(post => ({
            post,
            safeContent: this.sanitizer.bypassSecurityTrustHtml(post.content),
            loading: false,
            error: false
          })),
          tap(state => {
            if (state.post) {
              this.updateSEO(state.post);
              this.updateBreadcrumb(state.post);
            }
          }),
          catchError(error => {
            console.error('Failed to load blog post:', error);
            return of({ post: null, safeContent: '', loading: false, error: true });
          })
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateSEO(post: BlogPost): void {
    this.seoService.updateMetadata({
      title: post.seo.metaTitle || post.title,
      description: post.seo.metaDescription || post.summary,
      keywords: post.seo.keywords || [post.category.name, ...post.tags],
      canonical: `https://www.gadgetcloud.io/blog/${post.slug}`,
      ogImage: post.seo.ogImage || post.featuredImage,
      ogType: 'article' as const,
      structuredData: [{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        image: post.featuredImage,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        author: {
          '@type': 'Person',
          name: post.author.name
        },
        publisher: {
          '@type': 'Organization',
          name: 'GadgetCloud',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.gadgetcloud.io/assets/logo.png'
          }
        },
        description: post.summary
      }]
    });
  }

  updateBreadcrumb(post: BlogPost): void {
    this.breadcrumbService.setLabel(`/blog/${post.slug}`, post.title);
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }

  shareArticle(platform: 'twitter' | 'linkedin' | 'facebook', title: string): void {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  }
}
