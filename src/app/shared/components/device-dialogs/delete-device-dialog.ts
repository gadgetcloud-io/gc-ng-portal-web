import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DeviceService, Device } from '../../../core/services/device.service';

@Component({
  selector: 'gc-delete-device-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './delete-device-dialog.html',
  styleUrl: './delete-device-dialog.scss'
})
export class DeleteDeviceDialogComponent {
  @Input() isOpen = false;
  @Input() device: Device | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() deviceDeleted = new EventEmitter<void>();

  isDeleting = false;
  error = '';

  constructor(private deviceService: DeviceService) {}

  onConfirmDelete(): void {
    if (!this.device?.id) {
      this.error = 'Device ID is missing';
      return;
    }

    this.isDeleting = true;
    this.error = '';

    this.deviceService.deleteDevice(this.device.id).subscribe({
      next: (result) => {
        this.isDeleting = false;
        if (result.success) {
          this.deviceDeleted.emit();
          this.close.emit();
        } else {
          this.error = result.error || 'Failed to delete device';
        }
      },
      error: (err) => {
        this.isDeleting = false;
        this.error = 'An error occurred while deleting the device';
        console.error('Error deleting device:', err);
      }
    });
  }

  onClose(): void {
    this.error = '';
    this.isDeleting = false;
    this.close.emit();
  }
}
