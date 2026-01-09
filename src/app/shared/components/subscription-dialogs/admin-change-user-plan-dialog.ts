import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { BillingService } from '../../../core/services/billing.service';
import { SubscriptionPlan, UserSubscription } from '../../../core/models/billing.model';
import { AlertComponent } from '../alert/alert';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { BadgeComponent } from '../badge/badge';

@Component({
  selector: 'app-admin-change-user-plan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AlertComponent,
    LoadingSpinnerComponent,
    BadgeComponent
  ],
  templateUrl: './admin-change-user-plan-dialog.html',
  styleUrl: './admin-change-user-plan-dialog.scss',
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
export class AdminChangeUserPlanDialogComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() userId: string = '';
  @Input() userName: string = '';
  @Input() userEmail: string = '';
  @Input() currentSubscription: UserSubscription | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() planChanged = new EventEmitter<UserSubscription>();

  // Available plans
  plans: SubscriptionPlan[] = [];
  isLoadingPlans = false;
  loadPlansError: string | null = null;

  // Form state
  selectedPlanId: string = '';
  reason: string = '';
  isChanging = false;
  changeError: string | null = null;
  fieldErrors: { [key: string]: string } = {};

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
    if (changes['isOpen'] && changes['isOpen'].currentValue && !changes['isOpen'].previousValue) {
      // Reset form when modal opens
      this.resetForm();
      this.loadPlans();
    }
  }

  /**
   * Load all available plans
   */
  async loadPlans(): Promise<void> {
    this.isLoadingPlans = true;
    this.loadPlansError = null;
    this.cdr.markForCheck();

    try {
      const plans = await this.billingService.getAllPlans(false).toPromise();
      this.plans = plans || [];

      // Pre-select current plan
      if (this.currentSubscription && !this.selectedPlanId) {
        this.selectedPlanId = this.currentSubscription.planId;
      }

      if (this.plans.length === 0) {
        this.loadPlansError = 'No plans available';
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      this.loadPlansError = 'Failed to load subscription plans';
    } finally {
      this.isLoadingPlans = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Reset form to defaults
   */
  private resetForm(): void {
    this.selectedPlanId = this.currentSubscription?.planId || '';
    this.reason = '';
    this.fieldErrors = {};
    this.changeError = null;
    this.cdr.markForCheck();
  }

  /**
   * Handle modal close
   */
  handleClose(): void {
    if (!this.isChanging) {
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
   * Validate form
   */
  private validateForm(): boolean {
    this.fieldErrors = {};

    if (!this.selectedPlanId) {
      this.fieldErrors['selectedPlanId'] = 'Please select a plan';
    }

    if (this.selectedPlanId === this.currentSubscription?.planId) {
      this.fieldErrors['selectedPlanId'] = 'User is already on this plan';
    }

    if (!this.reason || this.reason.trim().length < 10) {
      this.fieldErrors['reason'] = 'Reason is required (minimum 10 characters)';
    }

    this.cdr.markForCheck();
    return Object.keys(this.fieldErrors).length === 0;
  }

  /**
   * Handle plan change submission
   */
  async handleSubmit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.isChanging = true;
    this.changeError = null;
    this.cdr.markForCheck();

    try {
      const request = {
        planId: this.selectedPlanId,
        reason: this.reason
      };

      const updatedSubscription = await this.billingService.adminChangeUserPlan(
        this.userId,
        request
      ).toPromise();

      if (updatedSubscription) {
        this.planChanged.emit(updatedSubscription);
        this.resetForm();
      }
    } catch (error: any) {
      console.error('Failed to change user plan:', error);
      this.changeError = error.error?.message || error.message || 'Failed to change plan';
      this.isChanging = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Get plan name by ID
   */
  getPlanName(planId: string): string {
    const plan = this.plans.find(p => p.id === planId);
    return plan ? plan.displayName : planId;
  }

  /**
   * Get plan price
   */
  getPlanPrice(planId: string): string {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) return '';

    if (plan.price.amount === 0) return 'Free';
    return `₹${plan.price.amount} / ${plan.price.billingPeriod}`;
  }

  /**
   * Check if plan is selected
   */
  isPlanSelected(planId: string): boolean {
    return this.selectedPlanId === planId;
  }

  /**
   * Check if plan is current
   */
  isPlanCurrent(planId: string): boolean {
    return planId === this.currentSubscription?.planId;
  }
}
