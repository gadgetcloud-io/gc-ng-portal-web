import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../core/services/device.service';

@Component({
  selector: 'gc-device-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-card.html',
  styleUrl: './device-card.scss'
})
export class DeviceCardComponent {
  @Input() device!: Device;
  @Input() showActions = true;

  @Output() view = new EventEmitter<string>();
  @Output() edit = new EventEmitter<Device>();
  @Output() delete = new EventEmitter<Device>();
  @Output() viewDocuments = new EventEmitter<Device>();

  onCardClick(): void {
    this.view.emit(this.device.id);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.edit.emit(this.device);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.delete.emit(this.device);
  }

  onViewDocuments(event: Event): void {
    event.stopPropagation();
    this.viewDocuments.emit(this.device);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'expiring-soon':
        return 'status-warning';
      case 'expired':
        return 'status-danger';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'expiring-soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  }
}
