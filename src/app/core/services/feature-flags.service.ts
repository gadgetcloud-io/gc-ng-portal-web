import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

/**
 * Feature flags available in the system
 */
export enum FeatureFlag {
  ANALYTICS_DASHBOARD = 'analytics_dashboard',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  DEPRECIATION_TRACKING = 'depreciation_tracking',
  WARRANTY_PROTECTION = 'warranty_protection',
  BULK_IMPORT = 'bulk_import',
  EXPORT_DATA = 'export_data',
  AI_RECOMMENDATIONS = 'ai_recommendations',
  PREMIUM_REPORTS = 'premium_reports'
}

/**
 * Feature flags configuration per customer
 */
export interface FeatureFlagsConfig {
  [FeatureFlag.ANALYTICS_DASHBOARD]: boolean;
  [FeatureFlag.ADVANCED_ANALYTICS]: boolean;
  [FeatureFlag.DEPRECIATION_TRACKING]: boolean;
  [FeatureFlag.WARRANTY_PROTECTION]: boolean;
  [FeatureFlag.BULK_IMPORT]: boolean;
  [FeatureFlag.EXPORT_DATA]: boolean;
  [FeatureFlag.AI_RECOMMENDATIONS]: boolean;
  [FeatureFlag.PREMIUM_REPORTS]: boolean;
}

/**
 * Default feature flags (free tier)
 */
const DEFAULT_FLAGS: FeatureFlagsConfig = {
  [FeatureFlag.ANALYTICS_DASHBOARD]: true,  // Basic analytics always enabled
  [FeatureFlag.ADVANCED_ANALYTICS]: false,  // Premium feature
  [FeatureFlag.DEPRECIATION_TRACKING]: false,  // Premium feature
  [FeatureFlag.WARRANTY_PROTECTION]: true,  // Basic protection tracking enabled
  [FeatureFlag.BULK_IMPORT]: false,  // Premium feature
  [FeatureFlag.EXPORT_DATA]: true,  // Basic export enabled
  [FeatureFlag.AI_RECOMMENDATIONS]: false,  // Premium feature
  [FeatureFlag.PREMIUM_REPORTS]: false  // Premium feature
};

/**
 * Premium tier feature flags
 */
const PREMIUM_FLAGS: FeatureFlagsConfig = {
  [FeatureFlag.ANALYTICS_DASHBOARD]: true,
  [FeatureFlag.ADVANCED_ANALYTICS]: true,
  [FeatureFlag.DEPRECIATION_TRACKING]: true,
  [FeatureFlag.WARRANTY_PROTECTION]: true,
  [FeatureFlag.BULK_IMPORT]: true,
  [FeatureFlag.EXPORT_DATA]: true,
  [FeatureFlag.AI_RECOMMENDATIONS]: true,
  [FeatureFlag.PREMIUM_REPORTS]: true
};

/**
 * Service to manage customer-level feature flags
 *
 * Usage:
 * ```typescript
 * // Check if feature is enabled
 * if (this.featureFlags.isEnabled(FeatureFlag.ANALYTICS_DASHBOARD)) {
 *   // Show analytics dashboard
 * }
 *
 * // Subscribe to feature flag changes
 * this.featureFlags.isEnabled$(FeatureFlag.ADVANCED_ANALYTICS).subscribe(enabled => {
 *   if (enabled) {
 *     // Show advanced analytics
 *   }
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class FeatureFlagsService {
  private flagsSubject = new BehaviorSubject<FeatureFlagsConfig>(DEFAULT_FLAGS);
  public flags$: Observable<FeatureFlagsConfig> = this.flagsSubject.asObservable();

  constructor(private authService: AuthService) {
    // Subscribe to auth state changes to update feature flags
    this.authService.authState$.subscribe(authState => {
      if (authState.isAuthenticated && authState.user) {
        this.loadFlagsForUser(authState.user);
      } else {
        // Reset to default flags when logged out
        this.flagsSubject.next(DEFAULT_FLAGS);
      }
    });
  }

  /**
   * Load feature flags for a specific user
   * In a real implementation, this would fetch from backend API
   */
  private loadFlagsForUser(user: any): void {
    // TODO: In production, fetch from backend API
    // const flags = await this.apiService.get<FeatureFlagsConfig>('/api/feature-flags')

    // For now, determine flags based on user role or mock subscription tier
    // This is a placeholder - in production, flags would come from backend
    const flags = this.determineFlagsForUser(user);
    this.flagsSubject.next(flags);
  }

  /**
   * Determine feature flags based on user attributes
   * This is a placeholder - in production, flags come from backend
   */
  private determineFlagsForUser(user: any): FeatureFlagsConfig {
    // Check if user has premium subscription (placeholder logic)
    // In production, this info comes from backend
    const hasPremium = user.subscriptionTier === 'premium' || user.role === 'admin';

    return hasPremium ? { ...PREMIUM_FLAGS } : { ...DEFAULT_FLAGS };
  }

  /**
   * Check if a specific feature flag is enabled (synchronous)
   */
  isEnabled(flag: FeatureFlag): boolean {
    const currentFlags = this.flagsSubject.value;
    return currentFlags[flag] ?? false;
  }

  /**
   * Check if a specific feature flag is enabled (observable)
   */
  isEnabled$(flag: FeatureFlag): Observable<boolean> {
    return this.flags$.pipe(
      map(flags => flags[flag] ?? false)
    );
  }

  /**
   * Check if any of the given feature flags are enabled
   */
  isAnyEnabled(...flags: FeatureFlag[]): boolean {
    return flags.some(flag => this.isEnabled(flag));
  }

  /**
   * Check if all of the given feature flags are enabled
   */
  areAllEnabled(...flags: FeatureFlag[]): boolean {
    return flags.every(flag => this.isEnabled(flag));
  }

  /**
   * Get current feature flags configuration
   */
  getCurrentFlags(): FeatureFlagsConfig {
    return { ...this.flagsSubject.value };
  }

  /**
   * Manually set feature flags (for testing/admin purposes)
   * WARNING: This is for testing only. In production, flags come from backend.
   */
  setFlags(flags: Partial<FeatureFlagsConfig>): void {
    const currentFlags = this.flagsSubject.value;
    this.flagsSubject.next({ ...currentFlags, ...flags });
  }

  /**
   * Check if user has premium features
   */
  hasPremiumFeatures(): boolean {
    return this.isEnabled(FeatureFlag.ADVANCED_ANALYTICS) ||
           this.isEnabled(FeatureFlag.DEPRECIATION_TRACKING) ||
           this.isEnabled(FeatureFlag.PREMIUM_REPORTS);
  }

  /**
   * Get list of enabled premium features
   */
  getEnabledPremiumFeatures(): FeatureFlag[] {
    const premiumFeatures = [
      FeatureFlag.ADVANCED_ANALYTICS,
      FeatureFlag.DEPRECIATION_TRACKING,
      FeatureFlag.BULK_IMPORT,
      FeatureFlag.AI_RECOMMENDATIONS,
      FeatureFlag.PREMIUM_REPORTS
    ];

    return premiumFeatures.filter(flag => this.isEnabled(flag));
  }

  /**
   * Get list of disabled features (for upgrade prompts)
   */
  getDisabledFeatures(): FeatureFlag[] {
    const currentFlags = this.flagsSubject.value;
    return Object.keys(currentFlags)
      .filter(flag => !currentFlags[flag as FeatureFlag])
      .map(flag => flag as FeatureFlag);
  }
}
