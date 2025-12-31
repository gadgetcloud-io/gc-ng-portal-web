import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BulkAction {
  type: 'delete' | 'change-status';
  data?: any;
}

@Component({
  selector: 'gc-bulk-action-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-action-bar.html',
  styleUrl: './bulk-action-bar.scss'
})
export class BulkActionBarComponent {
  @Input() selectedCount: number = 0;
  @Output() clearSelection = new EventEmitter<void>();
  @Output() bulkDelete = new EventEmitter<void>();
  @Output() bulkChangeStatus = new EventEmitter<string>();

  showStatusMenu = false;

  onClearSelection(): void {
    this.clearSelection.emit();
  }

  onBulkDelete(): void {
    if (confirm(`Are you sure you want to delete ${this.selectedCount} gadget${this.selectedCount > 1 ? 's' : ''}?`)) {
      this.bulkDelete.emit();
    }
  }

  toggleStatusMenu(): void {
    this.showStatusMenu = !this.showStatusMenu;
  }

  onChangeStatus(status: string): void {
    this.bulkChangeStatus.emit(status);
    this.showStatusMenu = false;
  }

  // Close status menu when clicking outside
  closeStatusMenu(): void {
    this.showStatusMenu = false;
  }
}
