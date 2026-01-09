import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { BillingService } from '../../../core/services/billing.service';
import { UserSubscription, FeatureOverride } from '../../../core/models/billing.model';
import { AlertComponent } from '../alert/alert';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { BadgeComponent } from '../badge/badge';

interface OverrideField {
  key: string;
  label: string;
  type: 'number' | 'checkbox' | 'select' | 'multiselect';
  enabled: boolean;
  value: any;
  originalValue: any;
  options?: { value: string; label: string }[];
}

@Component({
  selector: 'app-admin-override-limits-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AlertComponent,
    LoadingSpinnerComponent,
    BadgeComponent
  ],
  templateUrl: './admin-override-limits-dialog.html',
  styleUrl: './admin-override-limits-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class AdminOverrideLimitsDialogComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() userId: string = '';
  @Input() userName: string = '';
  @Input() userEmail: string = '';
  @Input() currentSubscription: UserSubscription | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() overridesApplied = new EventEmitter<UserSubscription>();

  // Override fields
  overrideFields: OverrideField[] = [];

  // Support/notification channel options
  supportChannelOptions = [
    { value: 'in-app', label: 'In-App' },
    { value: 'email', label: 'Email' },
    { value: 'chat', label: 'Chat' },
    { value: 'phone', label: 'Phone' }
  ];

  notificationChannelOptions = [
    { value: 'in-app', label: 'In-App' },
    { value: 'email', label: 'Email' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push' }
  ];

  // Form state
  reason: string = '';
  isSaving = false;
  saveError: string | null = null;
  fieldError: string | null = null;

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.isOpen && this.currentSubscription) {
      this.initializeOverrideFields();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue && !changes['isOpen'].previousValue) {
      // Reset form when modal opens
      this.resetForm();
      if (this.currentSubscription) {
        this.initializeOverrideFields();
      }
    }
  }

  /**
   * Initialize override fields from current subscription
   */
  private initializeOverrideFields(): void {
    if (!this.currentSubscription) return;

    const features = this.currentSubscription.effectiveLimits;
    const overrides = this.currentSubscription.overrides || {};

    this.overrideFields = [
      {
        key: 'maxDevices',
        label: 'Max Devices',
        type: 'number',
        enabled: overrides.hasOwnProperty('maxDevices'),
        value: overrides.maxDevices ?? features.maxDevices,
        originalValue: features.maxDevices
      },
      {
        key: 'maxStorageBytes',
        label: 'Max Storage (MB)',
        type: 'number',
        enabled: overrides.hasOwnProperty('maxStorageBytes'),
        value: overrides.maxStorageBytes ? overrides.maxStorageBytes / 1048576 : features.maxStorageBytes / 1048576,
        originalValue: features.maxStorageBytes / 1048576
      },
      {
        key: 'maxDocumentsPerDevice',
        label: 'Max Documents per Device',
        type: 'number',
        enabled: overrides.hasOwnProperty('maxDocumentsPerDevice'),
        value: overrides.maxDocumentsPerDevice ?? features.maxDocumentsPerDevice,
        originalValue: features.maxDocumentsPerDevice
      },
      {
        key: 'aiPhotoRecognition',
        label: 'AI Photo Recognition',
        type: 'checkbox',
        enabled: overrides.hasOwnProperty('aiPhotoRecognition'),
        value: overrides.aiPhotoRecognition ?? features.aiPhotoRecognition,
        originalValue: features.aiPhotoRecognition
      },
      {
        key: 'prioritySupportHours',
        label: 'Priority Support (Hours)',
        type: 'number',
        enabled: overrides.hasOwnProperty('prioritySupportHours'),
        value: overrides.prioritySupportHours ?? features.prioritySupportHours,
        originalValue: features.prioritySupportHours
      },
      {
        key: 'supportChannels',
        label: 'Support Channels',
        type: 'multiselect',
        enabled: overrides.hasOwnProperty('supportChannels'),
        value: overrides.supportChannels ? [...overrides.supportChannels] : [...features.supportChannels],
        originalValue: features.supportChannels,
        options: this.supportChannelOptions
      },
      {
        key: 'dedicatedAccountManager',
        label: 'Dedicated Account Manager',
        type: 'checkbox',
        enabled: overrides.hasOwnProperty('dedicatedAccountManager'),
        value: overrides.dedicatedAccountManager ?? features.dedicatedAccountManager,
        originalValue: features.dedicatedAccountManager
      },
      {
        key: 'familySharingEnabled',
        label: 'Family Sharing Enabled',
        type: 'checkbox',
        enabled: overrides.hasOwnProperty('familySharingEnabled'),
        value: overrides.familySharingEnabled ?? features.familySharingEnabled,
        originalValue: features.familySharingEnabled
      },
      {
        key: 'maxFamilyMembers',
        label: 'Max Family Members',
        type: 'number',
        enabled: overrides.hasOwnProperty('maxFamilyMembers'),
        value: overrides.maxFamilyMembers ?? features.maxFamilyMembers,
        originalValue: features.maxFamilyMembers
      },
      {
        key: 'analyticsLevel',
        label: 'Analytics Level',
        type: 'select',
        enabled: overrides.hasOwnProperty('analyticsLevel'),
        value: overrides.analyticsLevel ?? features.analyticsLevel,
        originalValue: features.analyticsLevel,
        options: [
          { value: 'basic', label: 'Basic' },
          { value: 'advanced', label: 'Advanced' }
        ]
      },
      {
        key: 'notificationChannels',
        label: 'Notification Channels',
        type: 'multiselect',
        enabled: overrides.hasOwnProperty('notificationChannels'),
        value: overrides.notificationChannels ? [...overrides.notificationChannels] : [...features.notificationChannels],
        originalValue: features.notificationChannels,
        options: this.notificationChannelOptions
      },
      {
        key: 'canCreateRepairRequests',
        label: 'Can Create Repair Requests',
        type: 'checkbox',
        enabled: overrides.hasOwnProperty('canCreateRepairRequests'),
        value: overrides.canCreateRepairRequests ?? features.canCreateRepairRequests,
        originalValue: features.canCreateRepairRequests
      },
      {
        key: 'enterpriseWarrantyTracking',
        label: 'Enterprise Warranty Tracking',
        type: 'checkbox',
        enabled: overrides.hasOwnProperty('enterpriseWarrantyTracking'),
        value: overrides.enterpriseWarrantyTracking ?? features.enterpriseWarrantyTracking,
        originalValue: features.enterpriseWarrantyTracking
      }
    ];

    this.cdr.markForCheck();
  }

  /**
   * Reset form to defaults
   */
  private resetForm(): void {
    this.reason = '';
    this.fieldError = null;
    this.saveError = null;
    this.cdr.markForCheck();
  }

  /**
   * Handle modal close
   */
  handleClose(): void {
    if (!this.isSaving) {
      this.resetForm();
      this.close.emit();
    }
  }

  /**
   * Handle backdrop click
   */
  handleBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.handleClose();
    }
  }

  /**
   * Toggle multiselect option
   */
  toggleMultiSelectOption(field: OverrideField, optionValue: string): void {
    if (!Array.isArray(field.value)) {
      field.value = [];
    }

    const index = field.value.indexOf(optionValue);
    if (index > -1) {
      field.value.splice(index, 1);
    } else {
      field.value.push(optionValue);
    }

    this.cdr.markForCheck();
  }

  /**
   * Check if multiselect option is selected
   */
  isMultiSelectOptionSelected(field: OverrideField, optionValue: string): boolean {
    return Array.isArray(field.value) && field.value.includes(optionValue);
  }

  /**
   * Format value for display
   */
  formatValue(field: OverrideField, value: any): string {
    if (value === null || value === undefined) return 'Not set';
    if (value === -1) return 'Unlimited';

    switch (field.type) {
      case 'checkbox':
        return value ? 'Enabled' : 'Disabled';
      case 'multiselect':
        return Array.isArray(value) ? value.join(', ') : 'None';
      case 'select':
        const option = field.options?.find(o => o.value === value);
        return option ? option.label : value;
      default:
        return value.toString();
    }
  }

  /**
   * Validate form
   */
  private validateForm(): boolean {
    this.fieldError = null;

    // Check if at least one override is enabled
    const hasOverrides = this.overrideFields.some(field => field.enabled);
    if (!hasOverrides) {
      this.fieldError = 'Please enable at least one override';
      this.cdr.markForCheck();
      return false;
    }

    // Validate reason
    if (!this.reason || this.reason.trim().length < 10) {
      this.fieldError = 'Reason is required (minimum 10 characters)';
      this.cdr.markForCheck();
      return false;
    }

    return true;
  }

  /**
   * Handle form submission
   */
  async handleSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;
    this.saveError = null;
    this.cdr.markForCheck();

    try {
      // Build overrides object from enabled fields
      const overrides: any = {};
      this.overrideFields.forEach(field => {
        if (field.enabled) {
          if (field.key === 'maxStorageBytes') {
            // Convert MB back to bytes
            overrides[field.key] = field.value * 1048576;
          } else {
            overrides[field.key] = field.value;
          }
        }
      });

      const request = {
        overrides,
        reason: this.reason
      };

      const updatedOverrides = await this.billingService.adminOverrideUserLimits(
        this.userId,
        request
      ).toPromise();

      if (updatedOverrides) {
        // Note: Service returns FeatureOverride, not UserSubscription
        // Component needs to emit the updated data - reload subscription separately
        this.overridesApplied.emit(updatedOverrides as any);
        this.resetForm();
      }
    } catch (error: any) {
      console.error('Failed to override user limits:', error);
      this.saveError = error.error?.message || error.message || 'Failed to override limits';
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }
}
