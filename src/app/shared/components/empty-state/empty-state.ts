import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type EmptyStateVariant = 'no-data' | 'no-results' | 'error' | 'success' | 'info';
export type EmptyStateSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gc-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss'
})
export class EmptyStateComponent {
  @Input() variant: EmptyStateVariant = 'no-data';
  @Input() size: EmptyStateSize = 'md';
  @Input() icon?: string;
  @Input() title = 'No data available';
  @Input() description?: string;
  @Input() actionText?: string;
  @Input() actionIcon?: string;

  @Output() onAction = new EventEmitter<void>();

  get emptyStateClasses(): string {
    return [
      'empty-state',
      `empty-state-${this.variant}`,
      `empty-state-${this.size}`
    ].join(' ');
  }

  get defaultIcon(): string {
    if (this.icon) return this.icon;

    const defaultIcons: Record<EmptyStateVariant, string> = {
      'no-data': '📭',
      'no-results': '🔍',
      'error': '⚠️',
      'success': '✓',
      'info': 'ℹ️'
    };

    return defaultIcons[this.variant];
  }

  handleAction() {
    this.onAction.emit();
  }
}
