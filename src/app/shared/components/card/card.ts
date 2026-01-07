import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'elevated' | 'bordered' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'gc-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.scss'
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
  @Input() padding: CardPadding = 'md';
  @Input() hoverable = false;
  @Input() clickable = false;

  get cardClasses(): string {
    const classes = [
      'card',
      `card-${this.variant}`,
      `card-padding-${this.padding}`
    ];

    if (this.hoverable) {
      classes.push('card-hoverable');
    }

    if (this.clickable) {
      classes.push('card-clickable');
    }

    return classes.join(' ');
  }
}
