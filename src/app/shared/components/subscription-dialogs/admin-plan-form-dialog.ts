import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { BillingService } from '../../../core/services/billing.service';
import { SubscriptionPlan, CreatePlanRequest, UpdatePlanRequest } from '../../../core/models/billing.model';
import { AlertComponent } from '../alert/alert';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-admin-plan-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AlertComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './admin-plan-form-dialog.html',
  styleUrl: './admin-plan-form-dialog.scss',
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
export class AdminPlanFormDialogComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() plan: SubscriptionPlan | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<SubscriptionPlan>();

  // Form data
  formData = {
    name: 'Standard',
    displayName: '',
    description: '',
    priceAmount: 0,
    currency: 'INR',
    billingPeriod: 'monthly' as 'monthly' | 'yearly',
    maxDevices: 5,
    maxStorageBytes: 104857600, // 100 MB in bytes
    maxDocumentsPerDevice: 5,
    aiPhotoRecognition: true,
    prioritySupportHours: 48,
    supportChannels: [] as string[],
    dedicatedAccountManager: false,
    familySharingEnabled: false,
    maxFamilyMembers: 0,
    analyticsLevel: 'basic' as 'basic' | 'advanced',
    notificationChannels: [] as string[],
    canCreateRepairRequests: true,
    enterpriseWarrantyTracking: false,
    displayOrder: 1,
    isVisible: true,
    isDefault: false,
    reason: '' // Required for edit mode
  };

  // Form state
  isSaving = false;
  saveError: string | null = null;
  fieldErrors: { [key: string]: string } = {};

  // Multi-select options
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

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.mode === 'edit' && this.plan) {
      this.loadPlanData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plan'] && this.plan && this.mode === 'edit') {
      this.loadPlanData();
    }

    if (changes['isOpen'] && changes['isOpen'].currentValue && !changes['isOpen'].previousValue) {
      // Reset form when modal opens
      if (this.mode === 'create') {
        this.resetForm();
      } else if (this.plan) {
        this.loadPlanData();
      }
    }
  }

  /**
   * Load plan data into form (edit mode)
   */
  private loadPlanData(): void {
    if (!this.plan) return;

    this.formData = {
      name: this.plan.name,
      displayName: this.plan.displayName,
      description: this.plan.description,
      priceAmount: this.plan.price.amount,
      currency: this.plan.price.currency,
      billingPeriod: this.plan.price.billingPeriod,
      maxDevices: this.plan.features.maxDevices,
      maxStorageBytes: this.plan.features.maxStorageBytes,
      maxDocumentsPerDevice: this.plan.features.maxDocumentsPerDevice,
      aiPhotoRecognition: this.plan.features.aiPhotoRecognition,
      prioritySupportHours: this.plan.features.prioritySupportHours,
      supportChannels: [...this.plan.features.supportChannels],
      dedicatedAccountManager: this.plan.features.dedicatedAccountManager,
      familySharingEnabled: this.plan.features.familySharingEnabled,
      maxFamilyMembers: this.plan.features.maxFamilyMembers,
      analyticsLevel: this.plan.features.analyticsLevel,
      notificationChannels: [...this.plan.features.notificationChannels],
      canCreateRepairRequests: this.plan.features.canCreateRepairRequests,
      enterpriseWarrantyTracking: this.plan.features.enterpriseWarrantyTracking,
      displayOrder: this.plan.displayOrder,
      isVisible: this.plan.isVisible,
      isDefault: this.plan.isDefault,
      reason: ''
    };

    this.cdr.markForCheck();
  }

  /**
   * Reset form to defaults (create mode)
   */
  private resetForm(): void {
    this.formData = {
      name: 'Standard',
      displayName: '',
      description: '',
      priceAmount: 0,
      currency: 'INR',
      billingPeriod: 'monthly',
      maxDevices: 5,
      maxStorageBytes: 104857600,
      maxDocumentsPerDevice: 5,
      aiPhotoRecognition: true,
      prioritySupportHours: 48,
      supportChannels: ['in-app', 'email'],
      dedicatedAccountManager: false,
      familySharingEnabled: false,
      maxFamilyMembers: 0,
      analyticsLevel: 'basic',
      notificationChannels: ['in-app', 'email'],
      canCreateRepairRequests: true,
      enterpriseWarrantyTracking: false,
      displayOrder: 1,
      isVisible: true,
      isDefault: false,
      reason: ''
    };

    this.fieldErrors = {};
    this.saveError = null;
    this.cdr.markForCheck();
  }

  /**
   * Handle modal close
   */
  handleClose(): void {
    if (!this.isSaving) {
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
   * Toggle multi-select option
   */
  toggleOption(array: string[], value: string): void {
    const index = array.indexOf(value);
    if (index > -1) {
      array.splice(index, 1);
    } else {
      array.push(value);
    }
    this.cdr.markForCheck();
  }

  /**
   * Check if option is selected
   */
  isOptionSelected(array: string[], value: string): boolean {
    return array.includes(value);
  }

  /**
   * Validate form
   */
  private validateForm(): boolean {
    this.fieldErrors = {};

    // Display name required
    if (!this.formData.displayName || this.formData.displayName.trim().length === 0) {
      this.fieldErrors['displayName'] = 'Display name is required';
    }

    // Description required
    if (!this.formData.description || this.formData.description.trim().length === 0) {
      this.fieldErrors['description'] = 'Description is required';
    } else if (this.formData.description.length > 500) {
      this.fieldErrors['description'] = 'Description must be less than 500 characters';
    }

    // Price must be >= 0
    if (this.formData.priceAmount < 0) {
      this.fieldErrors['priceAmount'] = 'Price must be 0 or greater';
    }

    // Max devices must be > 0 or -1 (unlimited)
    if (this.formData.maxDevices !== -1 && this.formData.maxDevices <= 0) {
      this.fieldErrors['maxDevices'] = 'Max devices must be greater than 0 or -1 for unlimited';
    }

    // Reason required for edit mode
    if (this.mode === 'edit') {
      if (!this.formData.reason || this.formData.reason.trim().length < 10) {
        this.fieldErrors['reason'] = 'Reason is required (minimum 10 characters)';
      }
    }

    this.cdr.markForCheck();
    return Object.keys(this.fieldErrors).length === 0;
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
      if (this.mode === 'create') {
        await this.createPlan();
      } else {
        await this.updatePlan();
      }
    } catch (error: any) {
      console.error('Failed to save plan:', error);
      this.saveError = error.error?.message || error.message || 'Failed to save plan';
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Create new plan
   */
  private async createPlan(): Promise<void> {
    const request: CreatePlanRequest = {
      name: this.formData.name,
      displayName: this.formData.displayName,
      description: this.formData.description,
      price: {
        amount: this.formData.priceAmount,
        currency: this.formData.currency,
        billingPeriod: this.formData.billingPeriod
      },
      features: {
        maxDevices: this.formData.maxDevices,
        maxStorageBytes: this.formData.maxStorageBytes,
        maxDocumentsPerDevice: this.formData.maxDocumentsPerDevice,
        aiPhotoRecognition: this.formData.aiPhotoRecognition,
        prioritySupportHours: this.formData.prioritySupportHours,
        supportChannels: this.formData.supportChannels,
        dedicatedAccountManager: this.formData.dedicatedAccountManager,
        familySharingEnabled: this.formData.familySharingEnabled,
        maxFamilyMembers: this.formData.maxFamilyMembers,
        analyticsLevel: this.formData.analyticsLevel,
        notificationChannels: this.formData.notificationChannels,
        canCreateRepairRequests: this.formData.canCreateRepairRequests,
        enterpriseWarrantyTracking: this.formData.enterpriseWarrantyTracking
      },
      displayOrder: this.formData.displayOrder,
      isVisible: this.formData.isVisible,
      isDefault: this.formData.isDefault
    };

    const plan = await this.billingService.createPlan(request).toPromise();
    if (plan) {
      this.saved.emit(plan);
    }
  }

  /**
   * Update existing plan
   */
  private async updatePlan(): Promise<void> {
    if (!this.plan) return;

    const request: UpdatePlanRequest = {
      displayName: this.formData.displayName,
      description: this.formData.description,
      price: {
        amount: this.formData.priceAmount,
        currency: this.formData.currency,
        billingPeriod: this.formData.billingPeriod
      },
      features: {
        maxDevices: this.formData.maxDevices,
        maxStorageBytes: this.formData.maxStorageBytes,
        maxDocumentsPerDevice: this.formData.maxDocumentsPerDevice,
        aiPhotoRecognition: this.formData.aiPhotoRecognition,
        prioritySupportHours: this.formData.prioritySupportHours,
        supportChannels: this.formData.supportChannels,
        dedicatedAccountManager: this.formData.dedicatedAccountManager,
        familySharingEnabled: this.formData.familySharingEnabled,
        maxFamilyMembers: this.formData.maxFamilyMembers,
        analyticsLevel: this.formData.analyticsLevel,
        notificationChannels: this.formData.notificationChannels,
        canCreateRepairRequests: this.formData.canCreateRepairRequests,
        enterpriseWarrantyTracking: this.formData.enterpriseWarrantyTracking
      },
      displayOrder: this.formData.displayOrder,
      isVisible: this.formData.isVisible,
      reason: this.formData.reason
    };

    const plan = await this.billingService.updatePlan(this.plan.id, request).toPromise();
    if (plan) {
      this.saved.emit(plan);
    }
  }
}
