import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DeviceService } from '../../../core/services/device.service';

@Component({
  selector: 'gc-quick-add-device-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  templateUrl: './quick-add-device-dialog.html',
  styleUrl: './quick-add-device-dialog.scss'
})
export class QuickAddDeviceDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() deviceAdded = new EventEmitter<void>();

  // Form
  quickForm: FormGroup;

  // Categories
  categories: Array<{value: string; label: string; emoji: string}> = [];

  // State
  isSubmitting = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private deviceService: DeviceService
  ) {
    // Minimal form - only name and category required
    this.quickForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['', [Validators.required]]
    });

    // Load categories
    this.loadCategories();
  }

  private loadCategories(): void {
    this.deviceService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.quickForm.invalid) {
      Object.keys(this.quickForm.controls).forEach(key => {
        this.quickForm.get(key)?.markAsTouched();
      });
      this.error = 'Please fill in all required fields';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    // Get form values
    const formValue = this.quickForm.value;

    // Auto-fill smart defaults
    const today = new Date();
    const oneYearFromToday = new Date();
    oneYearFromToday.setFullYear(today.getFullYear() + 1);

    const deviceData = {
      name: formValue.name,
      category: formValue.category,
      manufacturer: 'Unknown', // Default manufacturer
      model: '', // Empty model
      purchaseDate: today.toISOString().split('T')[0], // Today's date (YYYY-MM-DD)
      warrantyExpires: oneYearFromToday.toISOString().split('T')[0], // 1 year from today
      status: 'active', // Default to active status
      serialNumber: '',
      purchasePrice: undefined,
      warrantyProvider: '',
      notes: ''
    };

    this.deviceService.createDevice(deviceData).subscribe({
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
    this.quickForm.reset();
    this.error = '';
    this.isSubmitting = false;
  }

  getCategoryIcon(category: string): string {
    const found = this.categories.find(c => c.value === category);
    return found ? found.emoji : '📱';
  }
}
