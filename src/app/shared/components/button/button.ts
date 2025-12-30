import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gc-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.html',
  styleUrl: './button.scss'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Output() onClick = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const classes = ['btn', `btn-${this.variant}`, `btn-${this.size}`];
    if (this.fullWidth) {
      classes.push('btn-full');
    }
    return classes.join(' ');
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled) {
      this.onClick.emit(event);
    }
  }
}
