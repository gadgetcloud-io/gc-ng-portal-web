import { Injectable } from '@angular/core';
import { Observable, map, catchError, of } from 'rxjs';
import { ApiService } from './api.service';
import {
  SubscriptionPlan,
  UserSubscription,
  LimitCheckResult,
  UsageSummary,
  UserUpgradePlanRequest,
  CreatePlanRequest,
  UpdatePlanRequest,
  ArchivePlanRequest,
  ChangeUserPlanRequest,
  OverrideUserFeaturesRequest,
  FeatureOverride,
  LimitType,
  PlanFeatures,
  SubscriptionUpgradeRequest,
  UpgradeRequestResponse
} from '../models/billing.model';

/**
 * Billing Service
 *
 * Handles all subscription plan and billing operations for both users and admins.
 * Provides methods for:
 * - Viewing available plans (public)
 * - Managing user subscriptions
 * - Checking feature limits
 * - Admin plan CRUD operations
 * - Admin subscription management
 */
@Injectable({
  providedIn: 'root'
})
export class BillingService {
  constructor(private api: ApiService) {}

  // =========================
  // USER-FACING METHODS
  // =========================

  /**
   * Get all active, visible subscription plans (for pricing page)
   * Public endpoint - no authentication required
   */
  getAvailablePlans(): Observable<SubscriptionPlan[]> {
    return this.api.get<SubscriptionPlan[]>('/billing/plans').pipe(
      catchError(error => {
        console.error('Failed to load plans:', error);
        return of([]);
      })
    );
  }

  /**
   * Get current user's subscription details with plan, overrides, and usage
   * Requires authentication
   */
  getUserSubscription(): Observable<UserSubscription | null> {
    return this.api.get<UserSubscription>('/billing/my-subscription').pipe(
      catchError(error => {
        console.error('Failed to load subscription:', error);
        return of(null);
      })
    );
  }

  /**
   * Upgrade user's subscription plan (mock payment)
   * Requires authentication
   *
   * @deprecated Use submitUpgradeRequest for ticket-based approval workflow
   * @param request - Upgrade request with planId, paymentMethod, transactionId
   * @returns Updated subscription details
   */
  upgradePlan(request: UserUpgradePlanRequest): Observable<UserSubscription | null> {
    return this.api.post<UserSubscription>('/billing/upgrade', request).pipe(
      catchError(error => {
        console.error('Failed to upgrade plan:', error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  /**
   * Submit subscription upgrade request (ticket-based workflow)
   * Creates a service ticket for support/admin to review and approve.
   * Requires authentication.
   *
   * @param request - Upgrade request with current/requested plan details
   * @returns Response with ticket ID and status
   */
  submitUpgradeRequest(request: SubscriptionUpgradeRequest): Observable<UpgradeRequestResponse> {
    return this.api.post<UpgradeRequestResponse>('/service-tickets/subscription_upgrade/submit', {
      formType: 'subscription_upgrade',
      data: request
    }).pipe(
      catchError(error => {
        console.error('Failed to submit upgrade request:', error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  /**
   * Check if user can perform an action (add device, upload file)
   *
   * @param limitType - Type of limit to check ("device" or "storage")
   * @param additionalBytes - Size of file to upload (for storage check), default 0
   * @returns Limit check result
   */
  checkLimit(limitType: LimitType, additionalBytes: number = 0): Observable<LimitCheckResult> {
    const params = additionalBytes > 0
      ? `?limitType=${limitType}&additionalBytes=${additionalBytes}`
      : `?limitType=${limitType}`;

    return this.api.get<LimitCheckResult>(`/billing/check-limit${params}`).pipe(
      catchError(error => {
        console.error('Failed to check limit:', error);
        // Return allowed=true on error (fail-open strategy)
        return of({
          allowed: true,
          current: 0,
          limit: -1,
          reason: 'Limit check unavailable'
        });
      })
    );
  }

  /**
   * Get complete usage summary for current user
   * Requires authentication
   */
  getUsageSummary(): Observable<UsageSummary | null> {
    return this.api.get<UsageSummary>('/billing/usage-summary').pipe(
      catchError(error => {
        console.error('Failed to load usage summary:', error);
        return of(null);
      })
    );
  }

  /**
   * Get feature access for current user
   * Requires authentication
   */
  getMyFeatures(): Observable<PlanFeatures | null> {
    return this.api.get<PlanFeatures>('/billing/features').pipe(
      catchError(error => {
        console.error('Failed to load features:', error);
        return of(null);
      })
    );
  }

  // =========================
  // ADMIN PLAN MANAGEMENT
  // =========================

  /**
   * List all subscription plans (including archived)
   * Admin only - requires permission: plans.view
   *
   * @param includeArchived - Include archived plans (default: false)
   */
  getAllPlans(includeArchived: boolean = false): Observable<SubscriptionPlan[]> {
    const params = includeArchived ? '?include_archived=true' : '';
    return this.api.get<SubscriptionPlan[]>(`/admin/plans${params}`).pipe(
      catchError(error => {
        console.error('Failed to load admin plans:', error);
        return of([]);
      })
    );
  }

  /**
   * Get detailed information for a specific plan
   * Admin only - requires permission: plans.view
   */
  getPlan(planId: string): Observable<SubscriptionPlan | null> {
    return this.api.get<SubscriptionPlan>(`/admin/plans/${planId}`).pipe(
      catchError(error => {
        console.error(`Failed to load plan ${planId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Create a new subscription plan
   * Admin only - requires permission: plans.create
   */
  createPlan(request: CreatePlanRequest): Observable<SubscriptionPlan | null> {
    return this.api.post<SubscriptionPlan>('/admin/plans', request).pipe(
      catchError(error => {
        console.error('Failed to create plan:', error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  /**
   * Update an existing subscription plan
   * Admin only - requires permission: plans.edit
   *
   * @param planId - Plan ID to update
   * @param request - Update request with changes and reason
   */
  updatePlan(planId: string, request: UpdatePlanRequest): Observable<SubscriptionPlan | null> {
    return this.api.put<SubscriptionPlan>(`/admin/plans/${planId}`, request).pipe(
      catchError(error => {
        console.error(`Failed to update plan ${planId}:`, error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  /**
   * Archive a subscription plan (soft delete)
   * Admin only - requires permission: plans.delete
   *
   * @param planId - Plan ID to archive
   * @param request - Archive request with reason
   */
  archivePlan(planId: string, request: ArchivePlanRequest): Observable<SubscriptionPlan | null> {
    return this.api.put<SubscriptionPlan>(`/admin/plans/${planId}/archive`, request).pipe(
      catchError(error => {
        console.error(`Failed to archive plan ${planId}:`, error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  /**
   * Get the default subscription plan
   * Admin only - requires permission: plans.view
   */
  getDefaultPlan(): Observable<SubscriptionPlan | null> {
    return this.api.get<SubscriptionPlan>('/admin/plans/default/info').pipe(
      catchError(error => {
        console.error('Failed to load default plan:', error);
        return of(null);
      })
    );
  }

  /**
   * Set a plan as the default plan for new users
   * Admin only - requires permission: plans.edit
   */
  setDefaultPlan(planId: string): Observable<SubscriptionPlan | null> {
    return this.api.put<SubscriptionPlan>(`/admin/plans/${planId}/set-default`, {}).pipe(
      catchError(error => {
        console.error(`Failed to set plan ${planId} as default:`, error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  // =========================
  // ADMIN SUBSCRIPTION MANAGEMENT
  // =========================

  /**
   * Get complete subscription details for a specific user (admin view)
   * Admin only - requires permission: subscriptions.view
   */
  getUserSubscriptionAdmin(userId: string): Observable<UserSubscription | null> {
    return this.api.get<UserSubscription>(`/admin/subscriptions/user/${userId}`).pipe(
      catchError(error => {
        console.error(`Failed to load subscription for user ${userId}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Admin changes user's subscription plan
   * Admin only - requires permission: subscriptions.change_plan
   *
   * @param userId - User ID to update
   * @param request - Change plan request with planId and reason
   */
  adminChangeUserPlan(userId: string, request: ChangeUserPlanRequest): Observable<UserSubscription | null> {
    return this.api.put<UserSubscription>(`/admin/subscriptions/user/${userId}/change-plan`, request).pipe(
      catchError(error => {
        console.error(`Failed to change plan for user ${userId}:`, error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  /**
   * Admin overrides feature limits for a specific user
   * Admin only - requires permission: subscriptions.override_limits
   *
   * @param userId - User ID to update
   * @param request - Override request with overrides and reason
   */
  adminOverrideUserLimits(
    userId: string,
    request: OverrideUserFeaturesRequest
  ): Observable<FeatureOverride | null> {
    return this.api.put<FeatureOverride>(
      `/admin/subscriptions/user/${userId}/override-features`,
      request
    ).pipe(
      catchError(error => {
        console.error(`Failed to override features for user ${userId}:`, error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  /**
   * Remove all feature overrides for a user (revert to plan defaults)
   * Admin only - requires permission: subscriptions.override_limits
   *
   * @param userId - User ID
   * @param reason - Reason for removal (min 10 chars)
   */
  adminRemoveUserOverrides(userId: string, reason: string): Observable<boolean> {
    return this.api.delete<void>(
      `/admin/subscriptions/user/${userId}/override-features?reason=${encodeURIComponent(reason)}`
    ).pipe(
      map(() => true),
      catchError(error => {
        console.error(`Failed to remove overrides for user ${userId}:`, error);
        throw error; // Re-throw so component can handle the error
      })
    );
  }

  /**
   * Get active feature overrides for a user
   * Admin only - requires permission: subscriptions.view
   */
  getUserOverrides(userId: string): Observable<FeatureOverride | null> {
    return this.api.get<FeatureOverride>(`/admin/subscriptions/user/${userId}/overrides`).pipe(
      catchError(error => {
        console.error(`Failed to load overrides for user ${userId}:`, error);
        return of(null);
      })
    );
  }

  // =========================
  // UTILITY METHODS
  // =========================

  /**
   * Format bytes to human-readable string (B, KB, MB, GB)
   */
  formatBytes(bytes: number): string {
    if (bytes === -1) return 'Unlimited';
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);

    return `${value.toFixed(i >= 2 ? 1 : 0)} ${sizes[i]}`;
  }

  /**
   * Format device/member count (-1 = unlimited)
   */
  formatCount(count: number): string {
    return count === -1 ? 'Unlimited' : count.toString();
  }

  /**
   * Format price for display (handles free plans)
   */
  formatPrice(amount: number): string {
    if (amount === 0) return 'Free';
    return `₹${amount}`;
  }

  /**
   * Get billing period label
   */
  getBillingPeriodLabel(period: string): string {
    if (period === 'monthly') return 'per month';
    if (period === 'yearly') return 'per year';
    return period;
  }

  /**
   * Calculate percentage used (for progress bars)
   */
  calculatePercentage(current: number, limit: number): number {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;
    return Math.min(100, Math.round((current / limit) * 100));
  }

  /**
   * Get progress bar color based on usage percentage
   */
  getProgressColor(percentage: number): string {
    if (percentage < 50) return 'var(--color-success)';
    if (percentage < 80) return 'var(--color-warning)';
    return 'var(--color-error)';
  }
}
