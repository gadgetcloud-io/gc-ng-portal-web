import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'gc-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() maxWidth: 'sm' | 'md' | 'lg' = 'md';
  @Output() close = new EventEmitter<void>();

  onBackdropClick(): void {
    this.close.emit();
  }

  onModalClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onClose(): void {
    this.close.emit();
  }
}
