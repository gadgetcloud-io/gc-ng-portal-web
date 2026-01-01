import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

export interface Breadcrumb {
  label: string;
  url: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="breadcrumbs" *ngIf="breadcrumbs.length > 0" aria-label="Breadcrumb" role="navigation">
      <ol class="breadcrumb-list">
        <li
          *ngFor="let breadcrumb of breadcrumbs; let last = last"
          class="breadcrumb-item">

          <a
            *ngIf="!last"
            [routerLink]="breadcrumb.url"
            class="breadcrumb-link"
            [attr.aria-label]="'Navigate to ' + breadcrumb.label">
            {{ breadcrumb.label }}
          </a>

          <span *ngIf="last" class="breadcrumb-current" aria-current="page">
            {{ breadcrumb.label }}
          </span>

          <span *ngIf="!last" class="breadcrumb-separator" aria-hidden="true">/</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');

    /* ===== LEMONADE-STYLE BREADCRUMBS ===== */
    .breadcrumbs {
      margin-bottom: 17px;
      font-family: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .breadcrumb-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 14px;
      font-weight: 400;
    }

    .breadcrumb-link {
      color: #797979;
      text-decoration: none;
      transition: all 0.3s ease;

      &:hover {
        text-decoration: underline;
        color: #4a4a4a;
      }

      &:focus-visible {
        outline: 2px solid #00B4A6;
        outline-offset: 2px;
        border-radius: 2px;
      }
    }

    .breadcrumb-current {
      color: #4a4a4a;
      font-weight: 400;
    }

    .breadcrumb-separator {
      color: #9b9b9b;
      user-select: none;
      pointer-events: none;
    }

    /* ===== MOBILE RESPONSIVE ===== */
    @media (max-width: 768px) {
      .breadcrumbs {
        margin-bottom: 12px;
      }

      .breadcrumb-item {
        font-size: 13px;
      }
    }

    /* ===== REDUCED MOTION ===== */
    @media (prefers-reduced-motion: reduce) {
      .breadcrumb-link {
        transition: none;
      }
    }
  `]
})
export class BreadcrumbsComponent implements OnInit, OnDestroy {
  breadcrumbs: Breadcrumb[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private breadcrumbService: BreadcrumbService
  ) {}

  ngOnInit(): void {
    // Build breadcrumbs on navigation
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
      });

    // Rebuild breadcrumbs when dynamic labels change
    this.breadcrumbService.dynamicLabels$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
      });

    // Build initial breadcrumbs
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    // Get the child routes
    const children: ActivatedRoute[] = route.children;

    // Return if there are no more children
    if (children.length === 0) {
      return breadcrumbs;
    }

    // Iterate over each child
    for (const child of children) {
      // Get the route's path
      const routeURL: string = child.snapshot.url
        .map(segment => segment.path)
        .join('/');

      // Append route URL to URL
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      // Get breadcrumb data from route
      const breadcrumbData = child.snapshot.data['breadcrumb'];

      // Add breadcrumb if data exists
      if (breadcrumbData) {
        // Handle dynamic breadcrumb labels
        let label: string;

        if (typeof breadcrumbData.label === 'function') {
          label = breadcrumbData.label(child.snapshot);
        } else {
          label = breadcrumbData.label;
        }

        // Check for dynamic label from service
        const dynamicLabel = this.breadcrumbService.getLabel(url);
        if (dynamicLabel) {
          label = dynamicLabel;
        }

        const breadcrumb: Breadcrumb = {
          label: label,
          url: url,
          icon: breadcrumbData.icon
        };

        breadcrumbs.push(breadcrumb);
      }

      // Recursive call for child routes
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
