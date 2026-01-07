import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gc-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';
  @Input() rounded = false;
  @Input() outlined = false;

  get badgeClasses(): string {
    const classes = [
      'badge',
      `badge-${this.variant}`,
      `badge-${this.size}`
    ];

    if (this.rounded) {
      classes.push('badge-rounded');
    }

    if (this.outlined) {
      classes.push('badge-outlined');
    }

    return classes.join(' ');
  }
}
