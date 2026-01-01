import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { FooterComponent } from './shared/components/footer/footer';
import { BreadcrumbsComponent } from './shared/components/breadcrumbs/breadcrumbs.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, BreadcrumbsComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  showBreadcrumbs = false;

  // Public routes that don't need breadcrumbs
  private publicRoutes = ['/', '/features', '/pricing', '/about', '/contact'];

  constructor(private router: Router) {
    // Listen to route changes to determine if breadcrumbs should be shown
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showBreadcrumbs = !this.publicRoutes.includes(event.urlAfterRedirects);
      });

    // Set initial state
    this.showBreadcrumbs = !this.publicRoutes.includes(this.router.url);
  }
}
