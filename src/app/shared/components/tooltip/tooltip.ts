import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
export type TooltipSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gc-tooltip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss'
})
export class TooltipComponent {
  @Input() text = '';
  @Input() position: TooltipPosition = 'top';
  @Input() size: TooltipSize = 'md';
  @Input() delay = 200; // milliseconds
  @Input() maxWidth = '200px';
  @Input() disabled = false;

  visible = false;
  private showTimeout?: number;

  constructor(private elementRef: ElementRef) {}

  @HostListener('mouseenter')
  onMouseEnter() {
    if (this.disabled) return;

    this.showTimeout = window.setTimeout(() => {
      this.visible = true;
    }, this.delay);
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    this.visible = false;
  }

  @HostListener('focus')
  onFocus() {
    if (this.disabled) return;
    this.visible = true;
  }

  @HostListener('blur')
  onBlur() {
    this.visible = false;
  }

  get tooltipClasses(): string {
    const classes = [
      'tooltip-content',
      `tooltip-${this.position}`,
      `tooltip-${this.size}`
    ];

    if (this.visible) {
      classes.push('tooltip-visible');
    }

    return classes.join(' ');
  }

  get tooltipId(): string {
    return `tooltip-${Math.random().toString(36).substr(2, 9)}`;
  }
}
