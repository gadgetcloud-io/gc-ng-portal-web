import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { BillingService } from '../../../core/services/billing.service';
import { SubscriptionPlan } from '../../../core/models/billing.model';
import { AlertComponent } from '../alert/alert';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';

@Component({
  selector: 'app-archive-plan-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AlertComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './archive-plan-confirm-dialog.html',
  styleUrl: './archive-plan-confirm-dialog.scss',
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
export class ArchivePlanConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() plan: SubscriptionPlan | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<SubscriptionPlan>();

  // Form state
  reason = '';
  isArchiving = false;
  archiveError: string | null = null;
  fieldError: string | null = null;

  constructor(
    private billingService: BillingService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Handle modal close
   */
  handleClose(): void {
    if (!this.isArchiving) {
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
   * Reset form to defaults
   */
  private resetForm(): void {
    this.reason = '';
    this.fieldError = null;
    this.archiveError = null;
    this.cdr.markForCheck();
  }

  /**
   * Validate reason field
   */
  private validateReason(): boolean {
    this.fieldError = null;

    if (!this.reason || this.reason.trim().length < 10) {
      this.fieldError = 'Reason is required (minimum 10 characters)';
      this.cdr.markForCheck();
      return false;
    }

    return true;
  }

  /**
   * Handle archive confirmation
   */
  async handleConfirm(): Promise<void> {
    if (!this.plan) return;

    if (!this.validateReason()) {
      return;
    }

    this.isArchiving = true;
    this.archiveError = null;
    this.cdr.markForCheck();

    try {
      const request = {
        reason: this.reason
      };

      const archivedPlan = await this.billingService.archivePlan(
        this.plan.id,
        request
      ).toPromise();

      if (archivedPlan) {
        this.confirmed.emit(archivedPlan);
        this.resetForm();
      }
    } catch (error: any) {
      console.error('Failed to archive plan:', error);
      this.archiveError = error.error?.message || error.message || 'Failed to archive plan';
      this.isArchiving = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Get warning message based on plan status
   */
  getWarningMessage(): string {
    if (!this.plan) return '';

    if (this.plan.isDefault) {
      return 'Cannot archive the default plan. Please set another plan as default first.';
    }

    return `Archive "${this.plan.displayName}"? Existing users will keep this plan, but no new subscriptions will be allowed.`;
  }
}
