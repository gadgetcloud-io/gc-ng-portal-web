import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnalyticsService, PortfolioAnalytics } from '../../../core/services/analytics.service';
import { FeatureFlagsService, FeatureFlag } from '../../../core/services/feature-flags.service';
import { CardComponent } from '../card/card';
import { BadgeComponent } from '../badge/badge';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { ButtonComponent } from '../button/button';

/**
 * Analytics Dashboard Component
 *
 * Displays comprehensive analytics for user's device portfolio:
 * - Total portfolio value and depreciation
 * - Warranty protection metrics
 * - Category-wise breakdowns
 * - Warranty expiration timeline
 * - Depreciation trends
 *
 * Features are controlled by feature flags (per customer)
 *
 * Usage:
 * ```html
 * <gc-analytics-dashboard></gc-analytics-dashboard>
 * ```
 */
@Component({
  selector: 'gc-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    BadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ButtonComponent
  ],
  templateUrl: './analytics-dashboard.html',
  styleUrl: './analytics-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Analytics data
  analytics: PortfolioAnalytics | null = null;
  isLoading = true;

  // Feature flags
  showAdvancedAnalytics = false;
  showDepreciation = false;
  showWarrantyProtection = true;
  showPremiumReports = false;

  constructor(
    private analyticsService: AnalyticsService,
    private featureFlags: FeatureFlagsService
  ) {}

  ngOnInit(): void {
    // Check feature flags
    this.showAdvancedAnalytics = this.featureFlags.isEnabled(FeatureFlag.ADVANCED_ANALYTICS);
    this.showDepreciation = this.featureFlags.isEnabled(FeatureFlag.DEPRECIATION_TRACKING);
    this.showWarrantyProtection = this.featureFlags.isEnabled(FeatureFlag.WARRANTY_PROTECTION);
    this.showPremiumReports = this.featureFlags.isEnabled(FeatureFlag.PREMIUM_REPORTS);

    // Load analytics data
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load portfolio analytics
   */
  private loadAnalytics(): void {
    this.isLoading = true;

    this.analyticsService.getPortfolioAnalytics$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analytics) => {
          this.analytics = analytics;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to load analytics:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Format currency (INR)
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Format month (YYYY-MM to human-readable)
   */
  formatMonth(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  /**
   * Get category icon
   */
  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'laptop': '💻',
      'smartphone': '📱',
      'tablet': '📱',
      'smartwatch': '⌚',
      'headphones': '🎧',
      'camera': '📷',
      'gaming-console': '🎮',
      'tv': '📺',
      'other': '📦'
    };
    return icons[category] || icons['other'];
  }

  /**
   * Get category label
   */
  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'laptop': 'Laptop',
      'smartphone': 'Smartphone',
      'tablet': 'Tablet',
      'smartwatch': 'Smartwatch',
      'headphones': 'Headphones',
      'camera': 'Camera',
      'gaming-console': 'Gaming Console',
      'tv': 'TV',
      'other': 'Other'
    };
    return labels[category] || 'Other';
  }

  /**
   * Get depreciation status badge variant
   */
  getDepreciationBadgeVariant(percentage: number): 'success' | 'warning' | 'error' {
    if (percentage < 15) return 'success';
    if (percentage < 30) return 'warning';
    return 'error';
  }

  /**
   * Get warranty status badge variant
   */
  getWarrantyBadgeVariant(active: number, total: number): 'success' | 'warning' | 'error' {
    const percentage = (active / total) * 100;
    if (percentage >= 70) return 'success';
    if (percentage >= 40) return 'warning';
    return 'error';
  }

  /**
   * Calculate chart height for category breakdown (simple bar chart simulation)
   */
  getCategoryBarHeight(value: number, maxValue: number): number {
    if (maxValue === 0) return 0;
    return (value / maxValue) * 100;
  }

  /**
   * Get maximum value from category breakdown (for chart scaling)
   */
  getMaxCategoryValue(): number {
    if (!this.analytics || this.analytics.categoryBreakdown.length === 0) return 0;
    return Math.max(...this.analytics.categoryBreakdown.map(c => c.totalValue));
  }

  /**
   * Check if user should upgrade for premium features
   */
  shouldShowUpgradePrompt(): boolean {
    return !this.showAdvancedAnalytics || !this.showDepreciation || !this.showPremiumReports;
  }

  /**
   * Get list of disabled premium features (for upgrade prompt)
   */
  getDisabledFeatures(): string[] {
    const disabled: string[] = [];

    if (!this.showAdvancedAnalytics) {
      disabled.push('Advanced Analytics');
    }
    if (!this.showDepreciation) {
      disabled.push('Depreciation Tracking');
    }
    if (!this.showPremiumReports) {
      disabled.push('Premium Reports');
    }

    return disabled;
  }
}
