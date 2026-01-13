import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { BillingService } from '../../../core/services/billing.service';
import { SubscriptionPlan, SubscriptionUpgradeRequest } from '../../../core/models/billing.model';
import { CardComponent } from '../card/card';
import { BadgeComponent } from '../badge/badge';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { AlertComponent } from '../alert/alert';

@Component({
  selector: 'app-plan-comparison-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    BadgeComponent,
    LoadingSpinnerComponent,
    AlertComponent
  ],
  templateUrl: './plan-comparison-modal.html',
  styleUrl: './plan-comparison-modal.scss',
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
    ]),
    trigger('scaleIn', [
      transition(':enter', [
        style({ transform: 'scale(0.9)', opacity: 0 }),
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class PlanComparisonModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() currentPlanId: string = '';
  @Input() currentPlanName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() planSelected = new EventEmitter<string>();
  @Output() upgradeRequested = new EventEmitter<{ ticketId?: string; requestedPlanId: string }>();

  plans: SubscriptionPlan[] = [];
  isLoadingPlans = false;
  loadError: string | null = null;

  // Confirmation state
  showConfirmation = false;
  selectedPlan: SubscriptionPlan | null = null;

  // Upgrade request state
  isSubmittingRequest = false;
  requestSubmitted = false;
  requestError: string | null = null;
  ticketId: string | null = null;
  upgradeReason: string = '';
  upgradeUrgency: 'low' | 'normal' | 'high' = 'normal';

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.isOpen) {
      this.loadPlans();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Load plans when modal is opened
    if (changes['isOpen'] && changes['isOpen'].currentValue && !changes['isOpen'].previousValue) {
      this.loadPlans();
    }
  }

  /**
   * Load available subscription plans
   */
  private async loadPlans(): Promise<void> {
    this.isLoadingPlans = true;
    this.loadError = null;
    this.cdr.markForCheck();

    try {
      const plans = await this.billingService.getAvailablePlans().toPromise();
      this.plans = plans || [];

      if (this.plans.length === 0) {
        this.loadError = 'No subscription plans available';
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      this.loadError = 'Failed to load subscription plans';
    } finally {
      this.isLoadingPlans = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle modal close
   */
  handleClose(): void {
    if (!this.showConfirmation) {
      this.close.emit();
    }
  }

  /**
   * Handle backdrop click (close modal)
   */
  handleBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.handleClose();
    }
  }

  /**
   * Handle plan selection
   */
  selectPlan(plan: SubscriptionPlan): void {
    // Don't allow selecting current plan
    if (plan.id === this.currentPlanId) {
      return;
    }

    // Show confirmation
    this.selectedPlan = plan;
    this.showConfirmation = true;
    this.cdr.markForCheck();
  }

  /**
   * Confirm plan selection - submits upgrade request
   */
  async confirmPlanSelection(): Promise<void> {
    if (!this.selectedPlan) {
      return;
    }

    this.isSubmittingRequest = true;
    this.requestError = null;
    this.cdr.markForCheck();

    const request: SubscriptionUpgradeRequest = {
      currentPlanId: this.currentPlanId,
      currentPlanName: this.currentPlanName,
      requestedPlanId: this.selectedPlan.id,
      requestedPlanName: this.selectedPlan.displayName,
      reason: this.upgradeReason || undefined,
      urgency: this.upgradeUrgency
    };

    try {
      const response = await this.billingService.submitUpgradeRequest(request).toPromise();
      this.ticketId = response?.id || null;
      this.requestSubmitted = true;
      this.isSubmittingRequest = false;

      // Emit the event so parent can handle success
      this.upgradeRequested.emit({
        ticketId: this.ticketId || undefined,
        requestedPlanId: this.selectedPlan.id
      });

      this.cdr.markForCheck();
    } catch (error: any) {
      console.error('Failed to submit upgrade request:', error);
      this.requestError = error?.error?.detail || 'Failed to submit upgrade request. Please try again.';
      this.isSubmittingRequest = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Cancel plan selection
   */
  cancelPlanSelection(): void {
    this.showConfirmation = false;
    this.selectedPlan = null;
    this.upgradeReason = '';
    this.upgradeUrgency = 'normal';
    this.requestError = null;
    this.cdr.markForCheck();
  }

  /**
   * Close success state and modal
   */
  closeSuccessState(): void {
    this.requestSubmitted = false;
    this.ticketId = null;
    this.showConfirmation = false;
    this.selectedPlan = null;
    this.upgradeReason = '';
    this.upgradeUrgency = 'normal';
    this.close.emit();
    this.cdr.markForCheck();
  }

  /**
   * Check if plan is current plan
   */
  isCurrentPlan(planId: string): boolean {
    return planId === this.currentPlanId;
  }

  /**
   * Get plan variant (highlight middle plan)
   */
  getPlanVariant(index: number): 'default' | 'elevated' {
    return index === 1 ? 'elevated' : 'default';
  }

  /**
   * Check if plan is most popular
   */
  isMostPopular(index: number): boolean {
    return index === 1; // Middle plan (Family) is most popular
  }

  /**
   * Format price for display
   */
  formatPrice(amount: number): string {
    return this.billingService.formatPrice(amount);
  }

  /**
   * Format bytes for display
   */
  formatBytes(bytes: number): string {
    return this.billingService.formatBytes(bytes);
  }

  /**
   * Format count for display
   */
  formatCount(count: number): string {
    return this.billingService.formatCount(count);
  }

  /**
   * Get billing period label
   */
  getBillingPeriodLabel(period: string): string {
    return this.billingService.getBillingPeriodLabel(period);
  }

  /**
   * Get feature list for display
   */
  getFeatureList(plan: SubscriptionPlan): string[] {
    const features: string[] = [];

    // Devices
    if (plan.features.maxDevices) {
      features.push(`${this.formatCount(plan.features.maxDevices)} devices`);
    }

    // Storage
    if (plan.features.maxStorageBytes) {
      features.push(`${this.formatBytes(plan.features.maxStorageBytes)} storage`);
    }

    // AI Photo Recognition
    if (plan.features.aiPhotoRecognition) {
      features.push('AI photo recognition');
    }

    // Support
    if (plan.features.prioritySupportHours) {
      const hours = plan.features.prioritySupportHours;
      const label = hours <= 4 ? 'Priority support (4h)' :
                    hours <= 24 ? 'Priority support (24h)' :
                    'Standard support (48h)';
      features.push(label);
    }

    // Family sharing
    if (plan.features.familySharingEnabled) {
      const members = this.formatCount(plan.features.maxFamilyMembers);
      features.push(`Family sharing (${members} members)`);
    }

    // Dedicated account manager
    if (plan.features.dedicatedAccountManager) {
      features.push('Dedicated account manager');
    }

    // Analytics
    if (plan.features.analyticsLevel) {
      const level = plan.features.analyticsLevel === 'advanced' ? 'Advanced' : 'Basic';
      features.push(`${level} analytics`);
    }

    return features;
  }
}
