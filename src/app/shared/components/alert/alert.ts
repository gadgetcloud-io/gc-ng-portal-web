import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

@Component({
  selector: 'gc-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.scss'
})
export class AlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() title?: string;
  @Input() dismissible = false;
  @Output() onDismiss = new EventEmitter<void>();

  isVisible = true;

  get alertClasses(): string {
    return `alert alert-${this.variant}`;
  }

  get iconName(): string {
    const icons = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ'
    };
    return icons[this.variant];
  }

  dismiss(): void {
    this.isVisible = false;
    this.onDismiss.emit();
  }
}
