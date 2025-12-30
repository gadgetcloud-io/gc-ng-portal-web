import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DeviceService, DeviceCreateRequest } from '../../../core/services/device.service';

@Component({
  selector: 'gc-add-device-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './add-device-dialog.html',
  styleUrl: './add-device-dialog.scss'
})
export class AddDeviceDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() deviceAdded = new EventEmitter<void>();

  device: DeviceCreateRequest = {
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: undefined,
    warrantyExpires: '',
    warrantyProvider: '',
    notes: ''
  };

  categories = [
    'Laptop',
    'Smartphone',
    'Tablet',
    'Headphones',
    'Smartwatch',
    'Camera',
    'Speaker',
    'TV',
    'Monitor',
    'Keyboard',
    'Mouse',
    'Printer',
    'Router',
    'Other'
  ];

  isSubmitting = false;
  error = '';

  constructor(private deviceService: DeviceService) {}

  onSubmit(): void {
    // Validate required fields
    if (!this.device.name || !this.device.category || !this.device.purchaseDate || !this.device.warrantyExpires) {
      this.error = 'Please fill in all required fields';
      return;
    }

    // Validate dates
    if (new Date(this.device.warrantyExpires) < new Date(this.device.purchaseDate)) {
      this.error = 'Warranty expiration must be after purchase date';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    this.deviceService.createDevice(this.device).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        if (result.success) {
          this.deviceAdded.emit();
          this.resetForm();
          this.close.emit();
        } else {
          this.error = result.error || 'Failed to add device';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = 'An error occurred while adding the device';
        console.error('Error adding device:', err);
      }
    });
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  private resetForm(): void {
    this.device = {
      name: '',
      category: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      purchasePrice: undefined,
      warrantyExpires: '',
      warrantyProvider: '',
      notes: ''
    };
    this.error = '';
    this.isSubmitting = false;
  }
}
