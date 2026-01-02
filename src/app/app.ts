import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header';
import { FooterComponent } from './shared/components/footer/footer';
import { BreadcrumbsComponent } from './shared/components/breadcrumbs/breadcrumbs.component';
import { FloatingHelpButtonComponent } from './shared/components/floating-help-button/floating-help-button';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, BreadcrumbsComponent, FloatingHelpButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  showBreadcrumbs = false;

  // Routes where breadcrumbs should be hidden
  private hideBreadcrumbsOn = ['/', '/features', '/pricing', '/blog'];

  constructor(private router: Router) {
    // Listen to route changes to determine if breadcrumbs should be shown
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.showBreadcrumbs = !this.hideBreadcrumbsOn.includes(event.urlAfterRedirects);
      });

    // Set initial state
    this.showBreadcrumbs = !this.hideBreadcrumbsOn.includes(this.router.url);
  }
}
