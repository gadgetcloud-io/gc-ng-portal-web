# Upgrade Prompts Integration Guide

**Purpose**: Guide for integrating the limit warning banner and limit reached modal components into the devices page and document upload flows.

**Components Created**:
- `LimitWarningBannerComponent` - Warning banner shown when ≥80% of limit
- `LimitReachedModalComponent` - Blocking modal shown when at limit

**Status**: Components implemented (commit e9728a8), integration pending

---

## Integration Steps

### 1. Devices Page Integration

**File**: `src/app/pages/devices/devices.ts`

#### Step 1.1: Import Components and Service

Add to imports section (around line 22):
```typescript
import { LimitWarningBannerComponent } from '../../shared/components/limit-warning-banner/limit-warning-banner';
import { LimitReachedModalComponent } from '../../shared/components/limit-reached-modal/limit-reached-modal';
import { FeatureLimitService } from '../../core/services/feature-limit.service';
import { BillingService } from '../../core/services/billing.service';
```

Add to component imports array (around line 42):
```typescript
LimitWarningBannerComponent,
LimitReachedModalComponent,
```

#### Step 1.2: Inject Services

Add to constructor (around line 104):
```typescript
private featureLimitService: FeatureLimitService,
private billingService: BillingService
```

#### Step 1.3: Add Component Properties

Add after dialog states (around line 78):
```typescript
// Limit warning and upgrade prompts
showDeviceLimitWarning = false;
showDeviceLimitModal = false;
deviceLimitCurrent = 0;
deviceLimitMax = 5;
currentPlanName = 'Standard';
```

#### Step 1.4: Check Limits on Component Init

Add to `ngOnInit()` method (around line 115):
```typescript
// Load subscription and check limits
this.loadSubscriptionLimits();
```

Add new method:
```typescript
private async loadSubscriptionLimits(): Promise<void> {
  try {
    // Load subscription into cache
    await this.featureLimitService.loadSubscription();

    // Get current subscription
    const subscription = this.featureLimitService.getSubscription();
    if (subscription) {
      this.deviceLimitCurrent = subscription.currentUsage.deviceCount;
      this.deviceLimitMax = subscription.effectiveLimits.maxDevices;
      this.currentPlanName = subscription.planDisplayName;

      // Show warning if ≥80% of limit
      const percentage = this.featureLimitService.getDeviceUsagePercentage();
      this.showDeviceLimitWarning = percentage >= 80 && this.deviceLimitMax !== -1;
    }
  } catch (error) {
    console.error('Failed to load subscription limits:', error);
  }
}
```

#### Step 1.5: Check Limit Before Opening Add Dialog

Modify `openAddDialog()` method (find existing method around line 250):
```typescript
openAddDialog(): void {
  // Check if user can add device
  const canAdd = this.featureLimitService.canAddDevice();

  if (!canAdd) {
    // Show limit reached modal
    this.showDeviceLimitModal = true;
    return;
  }

  // Original logic
  this.isAddDialogOpen = true;
}
```

Similarly for `openQuickAddDialog()` method:
```typescript
openQuickAddDialog(): void {
  // Check if user can add device
  const canAdd = this.featureLimitService.canAddDevice();

  if (!canAdd) {
    // Show limit reached modal
    this.showDeviceLimitModal = true;
    return;
  }

  // Original logic
  this.isQuickAddDialogOpen = true;
}
```

#### Step 1.6: Add Handler Methods for Limit Components

Add new methods:
```typescript
// Limit warning banner handlers
dismissDeviceLimitWarning(): void {
  this.showDeviceLimitWarning = false;
  // Store dismissal in localStorage to not show again for 7 days
  localStorage.setItem('device_limit_warning_dismissed', Date.now().toString());
}

handleUpgradeFromWarning(): void {
  // Navigate to profile subscription tab or open plan comparison modal
  this.router.navigate(['/profile'], { fragment: 'subscription' });
}

// Limit reached modal handlers
closeDeviceLimitModal(): void {
  this.showDeviceLimitModal = false;
}

handleUpgradeFromModal(): void {
  // Close modal and navigate to upgrade
  this.showDeviceLimitModal = false;
  this.router.navigate(['/profile'], { fragment: 'subscription' });
}

handleViewPlans(): void {
  // Close modal and navigate to plan comparison
  this.showDeviceLimitModal = false;
  this.router.navigate(['/profile'], { fragment: 'subscription' });
}

handleManageDevices(): void {
  // Close modal (user stays on devices page to manage)
  this.showDeviceLimitModal = false;
}

// Refresh subscription after device added/deleted
private async refreshSubscriptionLimits(): Promise<void> {
  await this.featureLimitService.refreshSubscription();
  await this.loadSubscriptionLimits();
}
```

#### Step 1.7: Refresh Limits After Device Operations

Add to `onDeviceAdded()` method (find existing method):
```typescript
onDeviceAdded(device: Device): void {
  // Existing logic...

  // Refresh subscription limits
  this.refreshSubscriptionLimits();
}
```

Add to `onDeviceDeleted()` method:
```typescript
onDeviceDeleted(): void {
  // Existing logic...

  // Refresh subscription limits
  this.refreshSubscriptionLimits();
}
```

---

### 2. Devices Page Template Integration

**File**: `src/app/pages/devices/devices.html`

#### Step 2.1: Add Warning Banner

Add after page header, before device list (around line 30):
```html
<!-- Device Limit Warning Banner -->
<app-limit-warning-banner
  [limitType]="'device'"
  [current]="deviceLimitCurrent"
  [limit]="deviceLimitMax"
  [visible]="showDeviceLimitWarning && !isLoading"
  (onUpgrade)="handleUpgradeFromWarning()"
  (onDismiss)="dismissDeviceLimitWarning()"
></app-limit-warning-banner>
```

#### Step 2.2: Add Limit Reached Modal

Add at end of template, before closing container:
```html
<!-- Device Limit Reached Modal -->
<app-limit-reached-modal
  [isOpen]="showDeviceLimitModal"
  [limitType]="'device'"
  [planName]="currentPlanName"
  [current]="deviceLimitCurrent"
  [limit]="deviceLimitMax"
  (onUpgrade)="handleUpgradeFromModal()"
  (onViewPlans)="handleViewPlans()"
  (onManageItems)="handleManageDevices()"
  (onClose)="closeDeviceLimitModal()"
></app-limit-reached-modal>
```

---

### 3. Document Upload Integration

**File**: `src/app/shared/components/document-dialogs/upload-document-dialog.ts`

#### Step 3.1: Import Components and Service

Add to imports:
```typescript
import { LimitWarningBannerComponent } from '../limit-warning-banner/limit-warning-banner';
import { LimitReachedModalComponent } from '../limit-reached-modal/limit-reached-modal';
import { FeatureLimitService } from '../../../core/services/feature-limit.service';
```

Add to component imports array:
```typescript
LimitWarningBannerComponent,
LimitReachedModalComponent,
```

#### Step 3.2: Inject Service

Add to constructor:
```typescript
private featureLimitService: FeatureLimitService
```

#### Step 3.3: Add Component Properties

Add properties:
```typescript
showStorageLimitWarning = false;
showStorageLimitModal = false;
storageLimitCurrent = 0;
storageLimitMax = 104857600; // 100 MB in bytes
currentPlanName = 'Standard';
```

#### Step 3.4: Check Storage Before Upload

Modify file selection handler:
```typescript
async onFileSelected(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];

  // Check storage limit
  const canUpload = this.featureLimitService.canUploadFile(file.size);

  if (!canUpload) {
    // Show limit reached modal
    this.showStorageLimitModal = true;
    input.value = ''; // Clear file input
    return;
  }

  // Existing upload logic...
}
```

#### Step 3.5: Load Storage Limits on Dialog Open

Add method:
```typescript
private async loadStorageLimits(): Promise<void> {
  try {
    const subscription = this.featureLimitService.getSubscription();
    if (subscription) {
      this.storageLimitCurrent = subscription.currentUsage.storageUsed;
      this.storageLimitMax = subscription.effectiveLimits.maxStorageBytes;
      this.currentPlanName = subscription.planDisplayName;

      // Show warning if ≥80% of storage limit
      const percentage = this.featureLimitService.getStorageUsagePercentage();
      this.showStorageLimitWarning = percentage >= 80 && this.storageLimitMax !== -1;
    }
  } catch (error) {
    console.error('Failed to load storage limits:', error);
  }
}
```

Call in dialog open handler:
```typescript
ngOnInit(): void {
  // Existing logic...

  this.loadStorageLimits();
}
```

#### Step 3.6: Add Handler Methods

```typescript
// Storage limit warning handlers
dismissStorageLimitWarning(): void {
  this.showStorageLimitWarning = false;
  localStorage.setItem('storage_limit_warning_dismissed', Date.now().toString());
}

handleUpgradeFromWarning(): void {
  // Close dialog and navigate to upgrade
  this.close.emit();
  // Parent component should navigate to /profile#subscription
}

handleManageStorage(): void {
  // Close dialog and navigate to storage management
  this.close.emit();
  // Parent component should navigate to settings/storage
}

// Storage limit modal handlers
closeStorageLimitModal(): void {
  this.showStorageLimitModal = false;
}

handleUpgradeFromModal(): void {
  this.showStorageLimitModal = false;
  this.close.emit();
  // Parent component should navigate to /profile#subscription
}

handleViewPlans(): void {
  this.showStorageLimitModal = false;
  this.close.emit();
  // Parent component should navigate to /profile#subscription
}
```

---

### 4. Document Upload Template Integration

**File**: `src/app/shared/components/document-dialogs/upload-document-dialog.html`

#### Step 4.1: Add Warning Banner

Add after dialog header, before file input:
```html
<!-- Storage Limit Warning Banner -->
<app-limit-warning-banner
  [limitType]="'storage'"
  [current]="storageLimitCurrent"
  [limit]="storageLimitMax"
  [visible]="showStorageLimitWarning"
  (onUpgrade)="handleUpgradeFromWarning()"
  (onDismiss)="dismissStorageLimitWarning()"
  (onManageStorage)="handleManageStorage()"
></app-limit-warning-banner>
```

#### Step 4.2: Add Limit Reached Modal

Add at end of template:
```html
<!-- Storage Limit Reached Modal -->
<app-limit-reached-modal
  [isOpen]="showStorageLimitModal"
  [limitType]="'storage'"
  [planName]="currentPlanName"
  [current]="storageLimitCurrent"
  [limit]="storageLimitMax"
  (onUpgrade)="handleUpgradeFromModal()"
  (onViewPlans)="handleViewPlans()"
  (onManageItems)="handleManageStorage()"
  (onClose)="closeStorageLimitModal()"
></app-limit-reached-modal>
```

---

## Warning Dismissal Logic

### LocalStorage Keys:
- `device_limit_warning_dismissed` - Timestamp when device warning was dismissed
- `storage_limit_warning_dismissed` - Timestamp when storage warning was dismissed

### Re-show Logic:
- Don't show warning if dismissed within last 7 days
- Check on component load:
```typescript
private shouldShowWarning(storageKey: string): boolean {
  const dismissedAt = localStorage.getItem(storageKey);
  if (!dismissedAt) return true;

  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  return parseInt(dismissedAt) < sevenDaysAgo;
}
```

Apply in `loadSubscriptionLimits()` and `loadStorageLimits()`:
```typescript
this.showDeviceLimitWarning = percentage >= 80 &&
  this.deviceLimitMax !== -1 &&
  this.shouldShowWarning('device_limit_warning_dismissed');
```

---

## Testing Checklist

### Device Limit Tests:
- [ ] Warning banner appears when at 4/5 devices (80%)
- [ ] Warning banner can be dismissed
- [ ] Warning doesn't reappear for 7 days after dismissal
- [ ] Modal appears when trying to add 6th device on 5-device plan
- [ ] "Upgrade to Family" button navigates to profile subscription tab
- [ ] "View All Plans" button navigates to plan comparison
- [ ] "Manage Devices" button closes modal
- [ ] Device count updates after adding/deleting devices
- [ ] Warning banner disappears after upgrading plan
- [ ] Modal doesn't appear for users with unlimited devices (Premium plan)

### Storage Limit Tests:
- [ ] Warning banner appears when at 80 MB / 100 MB (80%)
- [ ] Warning banner can be dismissed
- [ ] Warning doesn't reappear for 7 days after dismissal
- [ ] Modal appears when trying to upload file that would exceed limit
- [ ] "Upgrade to Family" button navigates to profile subscription tab
- [ ] "View All Plans" button navigates to plan comparison
- [ ] "Manage Storage" button closes modal and opens storage management
- [ ] Storage usage updates after uploading/deleting documents
- [ ] Warning banner disappears after upgrading plan
- [ ] Modal doesn't appear for users with unlimited storage (Premium plan)

### Accessibility Tests:
- [ ] Warning banner has proper ARIA labels
- [ ] Modal has role="dialog" and aria-modal="true"
- [ ] Keyboard navigation works (Tab, Escape to close)
- [ ] Focus trap works in modal
- [ ] Screen reader announces warnings and modals

### Mobile Tests:
- [ ] Warning banner is responsive (stacks on mobile)
- [ ] Modal is responsive and scrollable
- [ ] Buttons are touch-friendly (min 44px touch target)

---

## Analytics Tracking (Optional)

### Events to Track:
```typescript
// Warning banner events
analytics.track('limit_warning_shown', {
  limitType: 'device' | 'storage',
  percentage: 80,
  current: 4,
  limit: 5,
  planName: 'Standard'
});

analytics.track('limit_warning_dismissed', {
  limitType: 'device' | 'storage'
});

analytics.track('limit_warning_upgrade_clicked', {
  limitType: 'device' | 'storage'
});

// Modal events
analytics.track('limit_modal_shown', {
  limitType: 'device' | 'storage',
  current: 5,
  limit: 5,
  planName: 'Standard'
});

analytics.track('limit_modal_upgrade_clicked', {
  limitType: 'device' | 'storage'
});

analytics.track('limit_modal_view_plans_clicked', {
  limitType: 'device' | 'storage'
});

analytics.track('limit_modal_manage_clicked', {
  limitType: 'device' | 'storage'
});

analytics.track('limit_modal_dismissed', {
  limitType: 'device' | 'storage'
});
```

Add these tracking calls in handler methods after the actions complete.

---

## Performance Considerations

### Subscription Caching:
- FeatureLimitService caches subscription for 5 minutes
- Prevents excessive API calls when checking limits
- Automatically refreshes in background when cache expires
- Manual refresh after device/document operations

### Lazy Loading:
- Warning banners only rendered when visible=true
- Modals only rendered when isOpen=true
- Minimal performance impact on page load

### Debouncing:
- No debouncing needed (limit checks are synchronous client-side checks)
- Server-side checks only happen on actual add/upload actions

---

## Known Issues & Future Enhancements

### Known Issues:
- None currently

### Future Enhancements:
1. **Soft Limits**: Warn at 80%, 90%, 95% with different messaging
2. **Grace Period**: Allow temporary overages (e.g., 24-hour grace after hitting limit)
3. **Inline Usage Indicators**: Show "4/5 devices" in page header
4. **Progress Bars**: Visual progress bars for device and storage usage
5. **Upgrade Incentives**: Offer 10-20% discount if upgrading from warning banner
6. **A/B Testing**: Test different messaging, CTA copy, and timing
7. **Smart Timing**: Don't show warnings during first 24 hours after signup
8. **Feature Teasers**: Show tooltips about premium features (Family Sharing, Dedicated Manager)

---

## Support Resources

- **User Guide**: `USER_GUIDE_SUBSCRIPTION_PLANS.md`
- **FAQ**: `SUBSCRIPTION_FAQ.md`
- **Admin Guide**: `ADMIN_GUIDE_SUBSCRIPTION_MANAGEMENT.md`
- **Marketing Materials**: `UPGRADE_PROMOTION_MATERIALS.md`
- **Feature Limit Service**: `src/app/core/services/feature-limit.service.ts`
- **Billing Service**: `src/app/core/services/billing.service.ts`

---

**Last Updated**: January 2026
**Version**: 1.0

**Integration Status**: Pending (components created, integration guide documented)
