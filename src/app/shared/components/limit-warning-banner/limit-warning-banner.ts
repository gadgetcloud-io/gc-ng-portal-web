import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button';

export type LimitType = 'device' | 'storage';

/**
 * Limit Warning Banner Component
 *
 * Displays a warning banner when user is approaching their device or storage limit (≥80%).
 * Shows at the top of relevant pages (devices list, document upload).
 * Can be dismissed by the user.
 *
 * Usage:
 * <app-limit-warning-banner
 *   [limitType]="'device'"
 *   [current]="4"
 *   [limit]="5"
 *   [visible]="showBanner"
 *   (onUpgrade)="handleUpgrade()"
 *   (onDismiss)="handleDismiss()"
 * ></app-limit-warning-banner>
 */
@Component({
  selector: 'app-limit-warning-banner',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './limit-warning-banner.html',
  styleUrl: './limit-warning-banner.scss'
})
export class LimitWarningBannerComponent {
  @Input() limitType: LimitType = 'device';
  @Input() current: number = 0;
  @Input() limit: number = 5;
  @Input() visible: boolean = false;
  @Output() onUpgrade = new EventEmitter<void>();
  @Output() onDismiss = new EventEmitter<void>();
  @Output() onManageStorage = new EventEmitter<void>();

  get message(): string {
    const percentage = Math.round((this.current / this.limit) * 100);

    if (this.limitType === 'device') {
      return `You're close to your device limit (${this.current}/${this.limit})`;
    } else {
      return `Storage almost full (${this.formatBytes(this.current)} / ${this.formatBytes(this.limit)})`;
    }
  }

  get description(): string {
    if (this.limitType === 'device') {
      return `When you reach ${this.limit} devices, you'll need to upgrade to add more.`;
    } else {
      return 'Upgrade to Family (500 MB) or Premium (5 GB) to keep uploading files.';
    }
  }

  get icon(): string {
    return this.limitType === 'device' ? '📱' : '📂';
  }

  handleUpgrade(): void {
    this.onUpgrade.emit();
  }

  handleDismiss(): void {
    this.onDismiss.emit();
  }

  handleManageStorage(): void {
    this.onManageStorage.emit();
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
