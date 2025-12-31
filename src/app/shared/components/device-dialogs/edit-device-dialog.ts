import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DeviceService, Device } from '../../../core/services/device.service';

@Component({
  selector: 'gc-edit-device-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './edit-device-dialog.html',
  styleUrl: './edit-device-dialog.scss'
})
export class EditDeviceDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() device: Device | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() deviceUpdated = new EventEmitter<void>();

  editedDevice: Device = this.getEmptyDevice();

  categories: Array<{value: string; label: string; emoji: string}> = [];

  isSubmitting = false;
  error = '';

  constructor(private deviceService: DeviceService) {
    // Load categories from backend
    this.loadCategories();
  }

  private loadCategories(): void {
    this.deviceService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories in edit dialog:', error);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['device'] && this.device) {
      // Clone the device to avoid mutating the original
      this.editedDevice = { ...this.device };
    }
  }

  onSubmit(): void {
    if (!this.editedDevice.id) {
      this.error = 'Device ID is missing';
      return;
    }

    // Validate required fields
    if (!this.editedDevice.name || !this.editedDevice.category ||
        !this.editedDevice.purchaseDate || !this.editedDevice.warrantyExpires) {
      this.error = 'Please fill in all required fields';
      return;
    }

    // Validate dates
    if (new Date(this.editedDevice.warrantyExpires) < new Date(this.editedDevice.purchaseDate)) {
      this.error = 'Warranty expiration must be after purchase date';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    this.deviceService.updateDevice(this.editedDevice).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        if (result.success) {
          this.deviceUpdated.emit();
          this.close.emit();
        } else {
          this.error = result.error || 'Failed to update device';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = 'An error occurred while updating the device';
        console.error('Error updating device:', err);
      }
    });
  }

  onClose(): void {
    this.error = '';
    this.isSubmitting = false;
    this.close.emit();
  }

  private getEmptyDevice(): Device {
    return {
      id: '',
      name: '',
      category: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      purchasePrice: undefined,
      warrantyExpires: '',
      warrantyProvider: '',
      status: 'active',
      image: '',
      notes: ''
    };
  }
}
