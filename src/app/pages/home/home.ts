import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { LoginDialogComponent } from '../../shared/components/login-dialog/login-dialog';
import { SignupDialogComponent } from '../../shared/components/signup-dialog/signup-dialog';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { SeoService } from '../../core/services/seo.service';
import { SEO_CONFIG } from '../../core/config/seo-metadata.config';
import { BlogService } from '../../core/services/blog.service';
import { BlogPost } from '../../core/models/blog.model';
import { BlogCardComponent } from '../../shared/components/blog-card/blog-card.component';
import { ButtonComponent } from '../../shared/components/button/button';
import { ProgressIndicatorComponent } from './components/progress-indicator/progress-indicator';
import { InteractiveDemoComponent } from './components/interactive-demo/interactive-demo';
import { WarrantyCalculatorComponent } from './components/warranty-calculator/warranty-calculator';
import { BeforeAfterSliderComponent } from './components/before-after-slider/before-after-slider';
import { SaveProgressCtaComponent } from './components/save-progress-cta/save-progress-cta';
import { HomeDemoService, DemoState, DemoDevice } from './services/home-demo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoginDialogComponent,
    SignupDialogComponent,
    ScrollRevealDirective,
    BlogCardComponent,
    ButtonComponent,
    ProgressIndicatorComponent,
    InteractiveDemoComponent,
    WarrantyCalculatorComponent,
    BeforeAfterSliderComponent,
    SaveProgressCtaComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  // Dialogs
  isLoginDialogOpen = false;
  isSignupDialogOpen = false;

  // Demo state
  demoState$: Observable<DemoState>;

  // Exit intent tracking
  private hasShownExitIntent = false;

  // Featured blog posts
  featuredPosts: BlogPost[] = [];

  // Marketing content
  features = [
    {
      icon: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="25" fill="none" stroke="#0080C0" stroke-width="2"/><path d="M20 30 L27 37 L40 24" fill="none" stroke="#2AD5BD" stroke-width="3" stroke-linecap="round"/></svg>',
      title: 'Warranty Tracking',
      description: 'Never lose track of warranty expiration dates. Get smart reminders before they expire.'
    },
    {
      icon: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="20" width="30" height="25" rx="3" fill="none" stroke="#2A76E4" stroke-width="2"/><rect x="18" y="23" width="24" height="17" fill="none" stroke="#27C7B0" stroke-width="2" stroke-dasharray="2 2"/><line x1="25" y1="33" x2="35" y2="33" stroke="#0080C0" stroke-width="2"/></svg>',
      title: 'Document Storage',
      description: 'Store all your receipts, manuals, and documents in one secure cloud-based location.'
    },
    {
      icon: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><rect x="18" y="15" width="24" height="35" rx="3" fill="none" stroke="#27C7B0" stroke-width="2"/><circle cx="30" cy="43" r="2" fill="#0080C0"/><line x1="23" y1="20" x2="37" y2="20" stroke="#2A76E4" stroke-width="2"/><line x1="23" y1="25" x2="37" y2="25" stroke="#2A76E4" stroke-width="2"/></svg>',
      title: 'Device Inventory',
      description: 'Organize all your gadgets with photos, specs, and purchase details in beautiful cards.'
    },
    {
      icon: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="20" fill="none" stroke="#0080C0" stroke-width="2"/><path d="M30 15 L30 30 L40 35" fill="none" stroke="#27C7B0" stroke-width="2" stroke-linecap="round"/></svg>',
      title: 'Smart Reminders',
      description: 'Automated notifications for warranty renewals, service schedules, and important dates.'
    },
    {
      icon: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="8" fill="none" stroke="#2A76E4" stroke-width="2"/><circle cx="40" cy="35" r="6" fill="none" stroke="#27C7B0" stroke-width="2"/><line x1="32" y1="28" x2="36" y2="32" stroke="#0080C0" stroke-width="2"/></svg>',
      title: 'Family Sharing',
      description: 'Manage devices for your whole family. Perfect for parents tracking kids\' gadgets.'
    },
    {
      icon: '<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M30 15 L45 25 L45 45 L15 45 L15 25 Z" fill="none" stroke="#27C7B0" stroke-width="2"/><line x1="30" y1="30" x2="30" y2="45" stroke="#0080C0" stroke-width="2"/><line x1="25" y1="35" x2="35" y2="35" stroke="#2A76E4" stroke-width="2"/></svg>',
      title: 'Secure & Private',
      description: 'Bank-level encryption keeps your data safe. Your gadgets, your data, your control.'
    }
  ];

  steps = [
    {
      title: 'Add Your Gadgets',
      description: 'Snap a photo or enter details manually. Takes less than 30 seconds per device.',
      illustration: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="25" y="20" width="50" height="60" rx="5" fill="none" stroke="#0080C0" stroke-width="2"/><circle cx="50" cy="70" r="3" fill="#2AD5BD"/><text x="50" y="55" text-anchor="middle" font-size="30">+</text></svg>'
    },
    {
      title: 'Upload Documents',
      description: 'Store receipts, warranties, and manuals. Scan or upload from your device.',
      illustration: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="30" y="30" width="40" height="50" rx="3" fill="none" stroke="#2A76E4" stroke-width="2"/><path d="M40 45 L45 50 L55 40" fill="none" stroke="#27C7B0" stroke-width="2"/></svg>'
    },
    {
      title: 'Relax & Get Notified',
      description: 'We\'ll remind you before warranties expire. Sit back and let GadgetCloud do the work.',
      illustration: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="30" fill="none" stroke="#27C7B0" stroke-width="2"/><path d="M50 50 L50 30 M50 50 L65 60" fill="none" stroke="#0080C0" stroke-width="2"/></svg>'
    }
  ];

  testimonials = [
    {
      text: 'GadgetCloud saved me $500 on a laptop repair that was still under warranty. I had completely forgotten about it!',
      name: 'Sarah Chen',
      title: 'Small Business Owner',
      initials: 'SC'
    },
    {
      text: 'Managing gadgets for my family of 5 was chaos. Now everything is organized and I get reminders for all devices.',
      name: 'Michael Rodriguez',
      title: 'Dad & Tech Enthusiast',
      initials: 'MR'
    },
    {
      text: 'The interface is so clean and playful. Finally, a productivity app that doesn\'t feel like work!',
      name: 'Emma Thompson',
      title: 'Product Designer',
      initials: 'ET'
    }
  ];

  constructor(
    private seoService: SeoService,
    private blogService: BlogService,
    private router: Router,
    private homeDemoService: HomeDemoService
  ) {
    // Initialize demo state observable
    this.demoState$ = this.homeDemoService.demoState$;
  }

  ngOnInit(): void {
    this.updateSEO();
    this.loadFeaturedPosts();
  }

  private loadFeaturedPosts(): void {
    this.blogService.getFeaturedPosts(3).subscribe({
      next: (posts) => {
        this.featuredPosts = posts;
      },
      error: (error) => {
        console.error('Failed to load featured posts:', error);
      }
    });
  }

  viewPost(post: BlogPost): void {
    this.router.navigate(['/blog', post.slug]);
  }

  viewAllPosts(): void {
    this.router.navigate(['/blog']);
  }

  private updateSEO(): void {
    const organizationSchema = this.seoService.createOrganizationSchema();
    const breadcrumbSchema = this.seoService.createBreadcrumbSchema([
      { name: 'Home', url: 'https://www.gadgetcloud.io' }
    ]);

    this.seoService.updateMetadata({
      ...SEO_CONFIG['home'],
      structuredData: [organizationSchema, breadcrumbSchema]
    });
  }

  scrollToFeatures(): void {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToDemo(): void {
    const element = document.getElementById('demo');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  openSignupDialog(): void {
    this.isSignupDialogOpen = true;
  }

  openLoginDialog(): void {
    this.isLoginDialogOpen = true;
  }

  closeLoginDialog(): void {
    this.isLoginDialogOpen = false;
  }

  closeSignupDialog(): void {
    this.isSignupDialogOpen = false;
  }

  switchToSignup(): void {
    this.isLoginDialogOpen = false;
    this.isSignupDialogOpen = true;
  }

  switchToLogin(): void {
    this.isSignupDialogOpen = false;
    this.isLoginDialogOpen = true;
  }

  onLoginSuccess(): void {
    this.isLoginDialogOpen = false;
  }

  onSignupSuccess(): void {
    this.isSignupDialogOpen = false;
    // Transfer demo data to user account after successful signup
    this.homeDemoService.transferToAccount();
  }

  // === Demo-related methods ===

  /**
   * Open signup dialog with demo data transfer
   */
  openSignupWithDemo(): void {
    this.isSignupDialogOpen = true;
  }

  /**
   * Get current demo state (for use in template)
   */
  getDemoState(): DemoState {
    return this.homeDemoService.getCurrentState();
  }

  /**
   * Check if save CTA should be shown
   */
  shouldShowSaveCTA(): boolean {
    return this.homeDemoService.shouldShowSaveCTA();
  }

  /**
   * Reset demo state
   */
  resetDemo(): void {
    this.homeDemoService.resetDemo();
  }

  // === Exit Intent Detection ===

  /**
   * Detect mouse leaving viewport (exit intent)
   */
  @HostListener('document:mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent): void {
    // Only trigger if:
    // 1. User has interacted with demo
    // 2. User is not already signed up (check session)
    // 3. Exit intent hasn't been shown yet this session
    const demoState = this.getDemoState();
    const hasInteracted = demoState.engagementScore > 0;

    if (hasInteracted && !this.hasShownExitIntent) {
      this.hasShownExitIntent = true;
      this.showExitIntentModal();
    }
  }

  /**
   * Show exit intent modal
   */
  private showExitIntentModal(): void {
    const demoState = this.getDemoState();
    const deviceCount = demoState.devices.length;

    if (deviceCount > 0) {
      const message = `Don't lose your work! You've added ${deviceCount} gadget${deviceCount > 1 ? 's' : ''}. Sign up now to save your progress.`;

      // Simple confirm dialog for now - can be replaced with custom modal
      if (confirm(message)) {
        this.openSignupWithDemo();
      }
    }
  }
}
