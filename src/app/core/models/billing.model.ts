/**
 * Billing & Subscription Models
 *
 * TypeScript interfaces matching backend Pydantic models for subscription plans,
 * user subscriptions, and billing operations.
 */

/** Subscription Plan */
export interface SubscriptionPlan {
  id: string;                    // PLN_00001, PLN_00002, etc.
  name: string;                  // Standard, Family, Premium
  displayName: string;           // User-facing name
  description: string;           // Plan description
  price: PlanPrice;              // Pricing details
  features: PlanFeatures;        // Feature limits
  status: 'active' | 'archived' | 'draft';
  isDefault: boolean;            // Default plan for new users
  isVisible: boolean;            // Show on pricing page
  displayOrder: number;          // Sort order
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  archivedAt?: string | null;    // ISO timestamp or null
}

/** Plan Pricing */
export interface PlanPrice {
  amount: number;                // Price in INR
  currency: string;              // INR
  billingPeriod: 'monthly' | 'yearly';
}

/** Plan Features */
export interface PlanFeatures {
  maxDevices: number;            // -1 = unlimited
  maxStorageBytes: number;       // -1 = unlimited
  maxDocumentsPerDevice: number; // -1 = unlimited
  aiPhotoRecognition: boolean;
  prioritySupportHours: number;  // Response time in hours
  supportChannels: string[];     // ["in-app", "email", "chat", "phone"]
  dedicatedAccountManager: boolean;
  familySharingEnabled: boolean;
  maxFamilyMembers: number;      // -1 = unlimited
  analyticsLevel: 'basic' | 'advanced';
  notificationChannels: string[]; // ["in-app", "email", "sms", "push"]
  canCreateRepairRequests: boolean;
  enterpriseWarrantyTracking: boolean;
}

/** User Subscription (complete view with merged overrides) */
export interface UserSubscription {
  userId: string;
  planId: string;
  planName: string;
  planDisplayName: string;
  planFeatures: PlanFeatures;         // Plan's default features
  overrides: Partial<PlanFeatures> | null; // User-specific overrides
  effectiveLimits: PlanFeatures;      // Merged plan + overrides
  currentUsage: {
    deviceCount: number;
    storageUsed: number;              // Bytes
  };
  subscriptionStartedAt: string;      // ISO timestamp
  subscriptionUpdatedAt: string;      // ISO timestamp
  hasOverrides: boolean;
}

/** Feature Override (admin-only) */
export interface FeatureOverride {
  id: string;                    // OVR_00001, OVR_00002, etc.
  userId: string;
  overrides: Partial<PlanFeatures>;
  reason: string;                // Why override was created
  createdAt: string;
  createdBy: string;             // Admin user ID
  createdByEmail: string;
  updatedAt: string;
  updatedBy: string;
}

/** Request: User Upgrade Plan */
export interface UserUpgradePlanRequest {
  planId: string;                // New plan ID (PLN_00002, etc.)
  paymentMethod: string;         // "mock" for now
  transactionId?: string;        // Optional transaction reference
}

/** Request: Admin Create Plan */
export interface CreatePlanRequest {
  name: string;                  // Standard, Family, Premium
  displayName: string;
  description: string;
  price: PlanPrice;
  features: PlanFeatures;
  status?: 'active' | 'draft';   // Default: active
  isDefault?: boolean;           // Default: false
  isVisible?: boolean;           // Default: true
  displayOrder?: number;         // Default: auto-increment
}

/** Request: Admin Update Plan */
export interface UpdatePlanRequest {
  displayName?: string;
  description?: string;
  price?: PlanPrice;
  features?: Partial<PlanFeatures>;
  status?: 'active' | 'archived' | 'draft';
  isVisible?: boolean;
  displayOrder?: number;
  reason: string;                // REQUIRED: min 10 chars
}

/** Request: Admin Archive Plan */
export interface ArchivePlanRequest {
  reason: string;                // REQUIRED: min 10 chars
}

/** Request: Admin Change User Plan */
export interface ChangeUserPlanRequest {
  planId: string;                // New plan ID
  reason: string;                // REQUIRED: min 10 chars
}

/** Request: Admin Override User Features */
export interface OverrideUserFeaturesRequest {
  overrides: Partial<PlanFeatures>; // null values = use plan default
  reason: string;                // REQUIRED: min 10 chars
}

/** Limit Check Result */
export interface LimitCheckResult {
  allowed: boolean;              // Can perform action?
  current: number;               // Current usage
  limit: number;                 // Maximum allowed (-1 = unlimited)
  reason?: string;               // Explanation if not allowed
}

/** Usage Summary */
export interface UsageSummary {
  planId: string;
  planName: string;
  planDisplayName: string;
  deviceLimit: {
    current: number;
    limit: number;               // -1 = unlimited
    percentage: number;          // 0-100
    canAddMore: boolean;
  };
  storageLimit: {
    currentBytes: number;
    limitBytes: number;          // -1 = unlimited
    currentMB: number;
    limitMB: number;
    percentage: number;          // 0-100
    canUploadMore: boolean;
  };
  features: PlanFeatures;
  hasOverrides: boolean;
}

/** Limit Type for Check Endpoint */
export type LimitType = 'device' | 'storage';

/** Plan Comparison Item (for modal) */
export interface PlanComparison {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  isRecommended: boolean;
  ctaText: string;               // "Current Plan", "Upgrade", "Downgrade"
  ctaVariant: 'primary' | 'secondary' | 'ghost';
}

/** Request: Submit Subscription Upgrade Request (ticket-based workflow) */
export interface SubscriptionUpgradeRequest {
  currentPlanId: string;
  currentPlanName: string;
  requestedPlanId: string;
  requestedPlanName: string;
  reason?: string;
  urgency?: 'low' | 'normal' | 'high';
}

/** Response: Upgrade Request Submission */
export interface UpgradeRequestResponse {
  id: string;                    // Ticket ID (TKT_00001)
  formType: string;              // subscription_upgrade
  status: string;                // submitted, open, etc.
  createdAt: string;             // ISO timestamp
}
