import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button';

export type LimitType = 'device' | 'storage';

/**
 * Limit Reached Modal Component
 *
 * Displays a blocking modal when user has reached their device or storage limit.
 * Shown when user tries to add a device or upload a file but is at capacity.
 * Offers upgrade or alternative actions (delete devices, manage storage).
 *
 * Usage:
 * <app-limit-reached-modal
 *   [isOpen]="showModal"
 *   [limitType]="'device'"
 *   [planName]="'Standard'"
 *   [current]="5"
 *   [limit]="5"
 *   (onUpgrade)="handleUpgrade()"
 *   (onViewPlans)="handleViewPlans()"
 *   (onManageItems)="handleManageItems()"
 *   (onClose)="handleClose()"
 * ></app-limit-reached-modal>
 */
@Component({
  selector: 'app-limit-reached-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './limit-reached-modal.html',
  styleUrl: './limit-reached-modal.scss'
})
export class LimitReachedModalComponent {
  @Input() isOpen: boolean = false;
  @Input() limitType: LimitType = 'device';
  @Input() planName: string = 'Standard';
  @Input() current: number = 0;
  @Input() limit: number = 5;
  @Output() onUpgrade = new EventEmitter<void>();
  @Output() onViewPlans = new EventEmitter<void>();
  @Output() onManageItems = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  get title(): string {
    if (this.limitType === 'device') {
      return '🚫 Device Limit Reached';
    } else {
      return '🚨 Storage Full';
    }
  }

  get message(): string {
    if (this.limitType === 'device') {
      return `You've reached your limit of ${this.limit} devices on the ${this.planName} Plan.`;
    } else {
      return `You've used all ${this.formatBytes(this.limit)} of storage on the ${this.planName} Plan. This file can't be uploaded.`;
    }
  }

  get upgradeMessage(): string {
    if (this.limitType === 'device') {
      return '✨ Most users upgrade to Family Plan (₹999/month):';
    } else {
      return '✨ Upgrade to Family Plan (₹999/month):';
    }
  }

  get upgradeBenefits(): string[] {
    if (this.limitType === 'device') {
      return [
        '10 devices instead of 5',
        '500 MB storage (5x more!)',
        'Priority support (24-hour response)',
        'Family sharing with up to 5 members'
      ];
    } else {
      return [
        '500 MB storage (5x more!)',
        'Room for 500-1000 more receipts',
        '10 devices instead of 5',
        'Priority support'
      ];
    }
  }

  get optionMessage(): string {
    if (this.limitType === 'device') {
      return 'Delete an old device you no longer own';
    } else {
      return 'Delete old files to free up space';
    }
  }

  get manageButtonText(): string {
    if (this.limitType === 'device') {
      return 'Manage Devices';
    } else {
      return 'Manage Storage';
    }
  }

  handleUpgrade(): void {
    this.onUpgrade.emit();
  }

  handleViewPlans(): void {
    this.onViewPlans.emit();
  }

  handleManageItems(): void {
    this.onManageItems.emit();
  }

  handleClose(): void {
    this.onClose.emit();
  }

  handleBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.handleClose();
    }
  }

  private formatBytes(bytes: number): string {
    const mb = Math.round(bytes / (1024 * 1024));
    const gb = bytes / (1024 * 1024 * 1024);

    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    }
    return `${mb} MB`;
  }
}
