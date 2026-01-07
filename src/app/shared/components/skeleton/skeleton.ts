import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'text' | 'rect' | 'circle' | 'rounded';

@Component({
  selector: 'gc-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss'
})
export class SkeletonComponent {
  @Input() variant: SkeletonVariant = 'text';
  @Input() width?: string;
  @Input() height?: string;
  @Input() count = 1;
  @Input() animated = true;

  get skeletonClasses(): string {
    const classes = ['skeleton', `skeleton-${this.variant}`];
    if (this.animated) {
      classes.push('skeleton-animated');
    }
    return classes.join(' ');
  }

  get skeletonStyles(): { [key: string]: string } {
    const styles: { [key: string]: string } = {};
    if (this.width) {
      styles['width'] = this.width;
    }
    if (this.height) {
      styles['height'] = this.height;
    }
    return styles;
  }

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }
}
