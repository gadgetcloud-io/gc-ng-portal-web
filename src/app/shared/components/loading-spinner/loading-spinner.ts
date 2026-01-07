import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerVariant = 'primary' | 'secondary' | 'white';

@Component({
  selector: 'gc-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss'
})
export class LoadingSpinnerComponent {
  @Input() size: SpinnerSize = 'md';
  @Input() variant: SpinnerVariant = 'primary';
  @Input() label?: string;
  @Input() centered = false;

  get spinnerClasses(): string {
    const classes = [
      'spinner',
      `spinner-${this.size}`,
      `spinner-${this.variant}`
    ];
    return classes.join(' ');
  }

  get containerClasses(): string {
    const classes = ['spinner-container'];
    if (this.centered) {
      classes.push('spinner-centered');
    }
    return classes.join(' ');
  }
}
