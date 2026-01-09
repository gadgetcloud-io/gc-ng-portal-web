import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService } from '../../../core/services/billing.service';
import { SubscriptionPlan } from '../../../core/models/billing.model';
import { CardComponent } from '../../../shared/components/card/card';
import { BadgeComponent } from '../../../shared/components/badge/badge';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { AlertComponent } from '../../../shared/components/alert/alert';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { AdminPlanFormDialogComponent } from '../../../shared/components/subscription-dialogs/admin-plan-form-dialog';
import { ArchivePlanConfirmDialogComponent } from '../../../shared/components/subscription-dialogs/archive-plan-confirm-dialog';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    BadgeComponent,
    LoadingSpinnerComponent,
    AlertComponent,
    EmptyStateComponent,
    AdminPlanFormDialogComponent,
    ArchivePlanConfirmDialogComponent
  ],
  templateUrl: './admin-plans.html',
  styleUrl: './admin-plans.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPlansComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  isLoading = false;
  loadError: string | null = null;

  // Modal states
  showCreateModal = false;
  showEditModal = false;
  showArchiveModal = false;
  selectedPlan: SubscriptionPlan | null = null;

  // Success/error messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  /**
   * Load all subscription plans (including archived)
   */
  async loadPlans(): Promise<void> {
    this.isLoading = true;
    this.loadError = null;
    this.cdr.markForCheck();

    try {
      const plans = await this.billingService.getAllPlans(true).toPromise();
      this.plans = plans || [];

      if (this.plans.length === 0) {
        this.loadError = 'No subscription plans found';
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
      this.loadError = 'Failed to load subscription plans';
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Open create plan modal
   */
  openCreateModal(): void {
    this.showCreateModal = true;
    this.cdr.markForCheck();
  }

  /**
   * Close create plan modal
   */
  closeCreateModal(): void {
    this.showCreateModal = false;
    this.cdr.markForCheck();
  }

  /**
   * Handle plan created
   */
  async handlePlanCreated(plan: SubscriptionPlan): Promise<void> {
    this.closeCreateModal();
    this.showSuccessMessage(`Plan "${plan.displayName}" created successfully`);
    await this.loadPlans();
  }

  /**
   * Open edit plan modal
   */
  openEditModal(plan: SubscriptionPlan): void {
    this.selectedPlan = plan;
    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  /**
   * Close edit plan modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedPlan = null;
    this.cdr.markForCheck();
  }

  /**
   * Handle plan updated
   */
  async handlePlanUpdated(plan: SubscriptionPlan): Promise<void> {
    this.closeEditModal();
    this.showSuccessMessage(`Plan "${plan.displayName}" updated successfully`);
    await this.loadPlans();
  }

  /**
   * Open archive plan modal
   */
  openArchiveModal(plan: SubscriptionPlan): void {
    this.selectedPlan = plan;
    this.showArchiveModal = true;
    this.cdr.markForCheck();
  }

  /**
   * Close archive plan modal
   */
  closeArchiveModal(): void {
    this.showArchiveModal = false;
    this.selectedPlan = null;
    this.cdr.markForCheck();
  }

  /**
   * Handle plan archived
   */
  async handlePlanArchived(plan: SubscriptionPlan): Promise<void> {
    this.closeArchiveModal();
    this.showSuccessMessage(`Plan "${plan.displayName}" archived successfully`);
    await this.loadPlans();
  }

  /**
   * Get badge variant for plan status
   */
  getStatusBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  }

  /**
   * Format status label
   */
  formatStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

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
   * Format price for display
   */
  formatPrice(amount: number): string {
    return this.billingService.formatPrice(amount);
  }

  /**
   * Get billing period label
   */
  getBillingPeriodLabel(period: string): string {
    return this.billingService.getBillingPeriodLabel(period);
  }

  /**
   * Show success message
   */
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.errorMessage = null;
    this.cdr.markForCheck();

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.markForCheck();
    }, 3000);
  }

  /**
   * Show error message
   */
  showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.successMessage = null;
    this.cdr.markForCheck();

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.errorMessage = null;
      this.cdr.markForCheck();
    }, 5000);
  }
}
