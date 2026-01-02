import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { pathToLabel, isDynamicSegment } from '../../../core/utils/breadcrumb-utils';

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
          *ngFor="let breadcrumb of breadcrumbs; let last = last; let first = first"
          class="breadcrumb-item">

          <a
            *ngIf="!last"
            [routerLink]="breadcrumb.url"
            [class.breadcrumb-link]="true"
            [class.breadcrumb-link--home]="first && breadcrumb.icon"
            [attr.aria-label]="first && breadcrumb.icon ? 'Navigate to home' : 'Navigate to ' + breadcrumb.label">
            <span *ngIf="first && breadcrumb.icon" class="breadcrumb-icon">{{ breadcrumb.icon }}</span>
            <span *ngIf="!first || !breadcrumb.icon">{{ breadcrumb.label }}</span>
          </a>

          <span *ngIf="last" class="breadcrumb-current" aria-current="page">
            <span *ngIf="first && breadcrumb.icon" class="breadcrumb-icon">{{ breadcrumb.icon }}</span>
            <span *ngIf="!first || !breadcrumb.icon">{{ breadcrumb.label }}</span>
          </span>

          <span *ngIf="!last" class="breadcrumb-separator" aria-hidden="true">/</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    /* ===== GADGETCLOUD BREADCRUMBS ===== */
    .breadcrumbs {
      margin-bottom: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 8px 0;
      background: linear-gradient(to right, rgba(0, 128, 192, 0.03), transparent 50%);
      border-bottom: 1px solid rgba(0, 128, 192, 0.1);
    }

    .breadcrumb-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    .breadcrumb-link {
      color: #0080C0;
      text-decoration: none;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      padding: 1px 0;

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 0;
        height: 1.5px;
        background: linear-gradient(90deg, #0080C0, #67D4F6);
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &:hover {
        color: #006699;
        transform: translateX(2px);

        &::after {
          width: 100%;
        }
      }

      &:focus-visible {
        outline: 2px solid #0080C0;
        outline-offset: 3px;
        border-radius: 3px;
      }
    }

    .breadcrumb-current {
      color: #005580;
      font-weight: 600;
      padding: 1px 0;
      background: linear-gradient(120deg, #005580 0%, #006699 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .breadcrumb-separator {
      color: rgba(0, 128, 192, 0.4);
      user-select: none;
      pointer-events: none;
      font-size: 11px;
      font-weight: 300;
      margin: 0 1px;
    }

    .breadcrumb-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(0, 128, 192, 0.15));
    }

    .breadcrumb-link--home {
      display: inline-flex;
      align-items: center;
      padding: 3px 6px 3px 3px;
      border-radius: 5px;
      background: linear-gradient(135deg, rgba(0, 128, 192, 0.05), rgba(0, 128, 192, 0.1));
      border: 1px solid rgba(0, 128, 192, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      .breadcrumb-icon {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      &:hover {
        background: linear-gradient(135deg, rgba(0, 128, 192, 0.1), rgba(0, 128, 192, 0.15));
        border-color: rgba(0, 128, 192, 0.3);
        box-shadow: 0 2px 8px rgba(0, 128, 192, 0.15);
        transform: translateY(-1px);

        .breadcrumb-icon {
          transform: scale(1.15) rotate(-5deg);
        }
      }

      &::after {
        display: none;
      }
    }

    /* ===== MOBILE RESPONSIVE ===== */
    @media (max-width: 768px) {
      .breadcrumbs {
        margin-bottom: 16px;
        padding: 8px 0;
      }

      .breadcrumb-item {
        font-size: 13px;
      }

      .breadcrumb-icon {
        font-size: 16px;
      }

      .breadcrumb-link--home {
        padding: 3px 6px 3px 3px;
      }
    }

    /* ===== REDUCED MOTION ===== */
    @media (prefers-reduced-motion: reduce) {
      .breadcrumb-link,
      .breadcrumb-link--home,
      .breadcrumb-icon {
        transition: none;
      }

      .breadcrumb-link::after {
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
    // Add home breadcrumb at the start (only once at root level)
    if (url === '' && breadcrumbs.length === 0) {
      breadcrumbs.push({ label: 'Home', url: '/', icon: '🏠' });
    }

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

      // Special handling for device detail pages (/my-gadgets/:id)
      // Inject "My Gadgets" parent breadcrumb before the device name
      if (url.startsWith('/my-gadgets/') && url !== '/my-gadgets') {
        const hasMyGadgetsBreadcrumb = breadcrumbs.some(b => b.url === '/my-gadgets');
        if (!hasMyGadgetsBreadcrumb) {
          breadcrumbs.push({
            label: 'My Gadgets',
            url: '/my-gadgets'
          });
        }
      }

      // Get breadcrumb data from route
      const breadcrumbData = child.snapshot.data['breadcrumb'];

      // Determine if we should add a breadcrumb
      let shouldAddBreadcrumb = false;
      let label = '';
      let icon: string | undefined = undefined;

      if (breadcrumbData) {
        // Route has breadcrumb configuration
        shouldAddBreadcrumb = true;

        // Handle dynamic breadcrumb labels
        if (typeof breadcrumbData.label === 'function') {
          label = breadcrumbData.label(child.snapshot);
        } else {
          label = breadcrumbData.label;
        }

        // Store icon from breadcrumb data
        icon = breadcrumbData.icon;

        // Check for dynamic label from service (highest priority)
        const dynamicLabel = this.breadcrumbService.getLabel(url);
        if (dynamicLabel) {
          label = dynamicLabel;
        }
      } else if (routeURL !== '') {
        // Route has NO breadcrumb configuration - auto-generate
        const segments = routeURL.split('/').filter(s => s.length > 0);
        const lastSegment = segments[segments.length - 1];

        // Only add breadcrumb if the last segment is NOT a dynamic ID
        if (!isDynamicSegment(lastSegment)) {
          shouldAddBreadcrumb = true;

          // Check for dynamic label from service first
          const dynamicLabel = this.breadcrumbService.getLabel(url);
          if (dynamicLabel) {
            label = dynamicLabel;
          } else {
            // Auto-generate label from path segment
            label = pathToLabel(lastSegment);
          }
        }
      }

      // Add breadcrumb if we determined it should be added
      if (shouldAddBreadcrumb && label) {
        const breadcrumb: Breadcrumb = {
          label: label,
          url: url,
          icon: icon
        };

        breadcrumbs.push(breadcrumb);
      }

      // Recursive call for child routes
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}
