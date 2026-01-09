import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { BillingService } from './billing.service';
import { UserSubscription, LimitCheckResult } from '../models/billing.model';

/**
 * Feature Limit Service
 *
 * Provides client-side helpers for checking subscription limits before actions.
 * Caches subscription data to minimize API calls and provides synchronous checks
 * for better UX (show disabled buttons, warnings, etc. before API call).
 */
@Injectable({
  providedIn: 'root'
})
export class FeatureLimitService {
  // Cached subscription data
  private subscriptionCache$ = new BehaviorSubject<UserSubscription | null>(null);
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private billingService: BillingService) {}

  /**
   * Load and cache user's subscription
   * Call this on app init or after login
   */
  async loadSubscription(): Promise<void> {
    try {
      const subscription = await firstValueFrom(this.billingService.getUserSubscription());
      if (subscription) {
        this.subscriptionCache$.next(subscription);
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
      }
    } catch (error) {
      console.error('Failed to load subscription for feature limits:', error);
    }
  }

  /**
   * Get cached subscription (returns null if not loaded or expired)
   */
  getSubscription(): UserSubscription | null {
    if (Date.now() > this.cacheExpiry) {
      // Cache expired, reload in background
      this.loadSubscription();
    }
    return this.subscriptionCache$.value;
  }

  /**
   * Get subscription observable for reactive UI
   */
  getSubscription$(): Observable<UserSubscription | null> {
    if (Date.now() > this.cacheExpiry || !this.subscriptionCache$.value) {
      // Cache expired or empty, reload
      this.loadSubscription();
    }
    return this.subscriptionCache$.asObservable();
  }

  /**
   * Refresh subscription cache (call after plan change, override, etc.)
   */
  async refreshSubscription(): Promise<void> {
    await this.loadSubscription();
  }

  /**
   * Clear subscription cache (call on logout)
   */
  clearCache(): void {
    this.subscriptionCache$.next(null);
    this.cacheExpiry = 0;
  }

  // =========================
  // DEVICE LIMIT CHECKS
  // =========================

  /**
   * Check if user can add another device (client-side check)
   * Returns false if limit reached, true otherwise
   */
  canAddDevice(): boolean {
    const subscription = this.getSubscription();
    if (!subscription) return true; // Assume allowed if subscription not loaded

    const { effectiveLimits, currentUsage } = subscription;
    const maxDevices = effectiveLimits.maxDevices;

    // Unlimited devices
    if (maxDevices === -1) return true;

    // Check current count
    return currentUsage.deviceCount < maxDevices;
  }

  /**
   * Get remaining device slots
   * Returns -1 for unlimited, or number of slots remaining
   */
  getRemainingDevices(): number {
    const subscription = this.getSubscription();
    if (!subscription) return -1;

    const { effectiveLimits, currentUsage } = subscription;
    const maxDevices = effectiveLimits.maxDevices;

    if (maxDevices === -1) return -1; // Unlimited

    return Math.max(0, maxDevices - currentUsage.deviceCount);
  }

  /**
   * Get device usage percentage (0-100)
   * Returns 0 for unlimited
   */
  getDeviceUsagePercentage(): number {
    const subscription = this.getSubscription();
    if (!subscription) return 0;

    const { effectiveLimits, currentUsage } = subscription;
    const maxDevices = effectiveLimits.maxDevices;

    if (maxDevices === -1) return 0; // Unlimited

    return Math.min(100, Math.round((currentUsage.deviceCount / maxDevices) * 100));
  }

  /**
   * Server-side device limit check (for verification before action)
   */
  async checkDeviceLimit(): Promise<LimitCheckResult> {
    return firstValueFrom(this.billingService.checkLimit('device'));
  }

  // =========================
  // STORAGE LIMIT CHECKS
  // =========================

  /**
   * Check if user can upload file of given size (client-side check)
   * @param fileSize - File size in bytes
   */
  canUploadFile(fileSize: number): boolean {
    const subscription = this.getSubscription();
    if (!subscription) return true; // Assume allowed if subscription not loaded

    const { effectiveLimits, currentUsage } = subscription;
    const maxStorage = effectiveLimits.maxStorageBytes;

    // Unlimited storage
    if (maxStorage === -1) return true;

    // Check if current + file size <= limit
    return (currentUsage.storageUsed + fileSize) <= maxStorage;
  }

  /**
   * Get remaining storage in bytes
   * Returns -1 for unlimited
   */
  getRemainingStorage(): number {
    const subscription = this.getSubscription();
    if (!subscription) return -1;

    const { effectiveLimits, currentUsage } = subscription;
    const maxStorage = effectiveLimits.maxStorageBytes;

    if (maxStorage === -1) return -1; // Unlimited

    return Math.max(0, maxStorage - currentUsage.storageUsed);
  }

  /**
   * Get storage usage percentage (0-100)
   * Returns 0 for unlimited
   */
  getStorageUsagePercentage(): number {
    const subscription = this.getSubscription();
    if (!subscription) return 0;

    const { effectiveLimits, currentUsage } = subscription;
    const maxStorage = effectiveLimits.maxStorageBytes;

    if (maxStorage === -1) return 0; // Unlimited

    return Math.min(100, Math.round((currentUsage.storageUsed / maxStorage) * 100));
  }

  /**
   * Server-side storage limit check (for verification before upload)
   * @param fileSize - File size in bytes
   */
  async checkStorageLimit(fileSize: number): Promise<LimitCheckResult> {
    return firstValueFrom(this.billingService.checkLimit('storage', fileSize));
  }

  // =========================
  // FEATURE ACCESS CHECKS
  // =========================

  /**
   * Check if user has access to a specific feature
   * @param featureName - Feature to check (e.g., 'aiPhotoRecognition')
   */
  hasFeature(featureName: keyof typeof this.getSubscription().effectiveLimits): boolean {
    const subscription = this.getSubscription();
    if (!subscription) return false;

    const featureValue = subscription.effectiveLimits[featureName];

    // Boolean features
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }

    // Numeric features (treat -1 or > 0 as enabled)
    if (typeof featureValue === 'number') {
      return featureValue === -1 || featureValue > 0;
    }

    // Array features (treat non-empty as enabled)
    if (Array.isArray(featureValue)) {
      return featureValue.length > 0;
    }

    return false;
  }

  /**
   * Check if user can create repair requests
   */
  canCreateRepairRequest(): boolean {
    const subscription = this.getSubscription();
    if (!subscription) return true; // Default to allowed

    return subscription.effectiveLimits.canCreateRepairRequests;
  }

  /**
   * Check if user has AI photo recognition enabled
   */
  hasAIPhotoRecognition(): boolean {
    const subscription = this.getSubscription();
    if (!subscription) return false;

    return subscription.effectiveLimits.aiPhotoRecognition;
  }

  /**
   * Check if user has family sharing enabled
   */
  hasFamilySharing(): boolean {
    const subscription = this.getSubscription();
    if (!subscription) return false;

    return subscription.effectiveLimits.familySharingEnabled;
  }

  /**
   * Check if user has dedicated account manager
   */
  hasDedicatedAccountManager(): boolean {
    const subscription = this.getSubscription();
    if (!subscription) return false;

    return subscription.effectiveLimits.dedicatedAccountManager;
  }

  /**
   * Get priority support response time (in hours)
   */
  getPrioritySupportHours(): number {
    const subscription = this.getSubscription();
    if (!subscription) return 48; // Default to 48 hours

    return subscription.effectiveLimits.prioritySupportHours;
  }

  // =========================
  // UPGRADE PROMPTS
  // =========================

  /**
   * Get upgrade message for device limit
   */
  getDeviceLimitUpgradeMessage(): string {
    const subscription = this.getSubscription();
    if (!subscription) return 'Upgrade to add more devices';

    const { planDisplayName, effectiveLimits, currentUsage } = subscription;
    const maxDevices = effectiveLimits.maxDevices;

    if (maxDevices === -1) {
      return 'You have unlimited devices';
    }

    return `Your ${planDisplayName} plan allows ${maxDevices} device${maxDevices === 1 ? '' : 's'}. ` +
           `You currently have ${currentUsage.deviceCount}. Upgrade to add more devices.`;
  }

  /**
   * Get upgrade message for storage limit
   */
  getStorageLimitUpgradeMessage(): string {
    const subscription = this.getSubscription();
    if (!subscription) return 'Upgrade for more storage';

    const { planDisplayName, effectiveLimits, currentUsage } = subscription;
    const maxStorage = effectiveLimits.maxStorageBytes;

    if (maxStorage === -1) {
      return 'You have unlimited storage';
    }

    const usedMB = Math.round(currentUsage.storageUsed / (1024 * 1024));
    const limitMB = Math.round(maxStorage / (1024 * 1024));

    return `Your ${planDisplayName} plan allows ${limitMB}MB of storage. ` +
           `You've used ${usedMB}MB. Upgrade for more storage.`;
  }

  /**
   * Determine if user should see upgrade prompts
   * Returns true if user is near limits (>80%) or has reached limits
   */
  shouldShowUpgradePrompt(): boolean {
    const devicePercentage = this.getDeviceUsagePercentage();
    const storagePercentage = this.getStorageUsagePercentage();

    return devicePercentage >= 80 || storagePercentage >= 80;
  }

  // =========================
  // UTILITY METHODS
  // =========================

  /**
   * Format bytes to human-readable string
   */
  formatBytes(bytes: number): string {
    return this.billingService.formatBytes(bytes);
  }

  /**
   * Format count (handles unlimited)
   */
  formatCount(count: number): string {
    return this.billingService.formatCount(count);
  }

  /**
   * Get progress bar color based on percentage
   */
  getProgressColor(percentage: number): string {
    return this.billingService.getProgressColor(percentage);
  }
}
