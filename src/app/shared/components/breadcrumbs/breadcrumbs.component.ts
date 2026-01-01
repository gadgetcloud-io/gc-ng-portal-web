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
    <nav class="breadcrumbs" *ngIf="breadcrumbs.length > 0" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li *ngFor="let breadcrumb of breadcrumbs; let last = last" class="breadcrumb-item">
          <a
            *ngIf="!last"
            [routerLink]="breadcrumb.url"
            class="breadcrumb-link"
            [attr.aria-current]="last ? 'page' : null">
            <span *ngIf="breadcrumb.icon" class="breadcrumb-icon">{{ breadcrumb.icon }}</span>
            <span class="breadcrumb-label">{{ breadcrumb.label }}</span>
          </a>
          <span *ngIf="last" class="breadcrumb-current">
            <span *ngIf="breadcrumb.icon" class="breadcrumb-icon">{{ breadcrumb.icon }}</span>
            <span class="breadcrumb-label">{{ breadcrumb.label }}</span>
          </span>
          <span *ngIf="!last" class="breadcrumb-separator" aria-hidden="true">/</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumbs {
      padding: 1rem 0;
      background: transparent;
    }

    .breadcrumb-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .breadcrumb-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--neutral-600);
      text-decoration: none;
      transition: color 0.2s ease;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;

      &:hover {
        color: var(--brand-teal, #00B4A6);
        background: var(--neutral-100);
      }

      &:focus-visible {
        outline: 2px solid var(--brand-teal, #00B4A6);
        outline-offset: 2px;
      }
    }

    .breadcrumb-current {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: var(--neutral-900);
      font-weight: 600;
      padding: 0.25rem 0.5rem;
    }

    .breadcrumb-icon {
      font-size: 1rem;
      line-height: 1;
    }

    .breadcrumb-label {
      line-height: 1.5;
    }

    .breadcrumb-separator {
      color: var(--neutral-400);
      font-weight: 300;
      user-select: none;
    }

    @media (max-width: 640px) {
      .breadcrumbs {
        padding: 0.75rem 0;
      }

      .breadcrumb-item {
        font-size: 0.8125rem;
      }

      .breadcrumb-icon {
        font-size: 0.875rem;
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
