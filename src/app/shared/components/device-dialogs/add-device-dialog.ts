import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DeviceService } from '../../../core/services/device.service';

@Component({
  selector: 'gc-add-device-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  templateUrl: './add-device-dialog.html',
  styleUrl: './add-device-dialog.scss'
})
export class AddDeviceDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() deviceAdded = new EventEmitter<void>();

  // Stepper state
  currentStep = 1;
  totalSteps = 3;

  // Form
  deviceForm: FormGroup;

  // Categories
  categories: Array<{value: string; label: string; emoji: string}> = [];

  // State
  isSubmitting = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private deviceService: DeviceService
  ) {
    // Initialize form
    this.deviceForm = this.fb.group({
      // Step 1: Basic Info
      name: ['', [Validators.required]],
      category: ['', [Validators.required]],
      manufacturer: [''],
      model: [''],

      // Step 2: Purchase & Warranty
      purchaseDate: ['', [Validators.required]],
      purchasePrice: [''],
      warrantyExpires: ['', [Validators.required]],
      warrantyProvider: [''],

      // Step 3: Additional Details
      serialNumber: [''],
      notes: ['']
    });

    // Load categories from backend
    this.loadCategories();
  }

  private loadCategories(): void {
    this.deviceService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories in add dialog:', error);
      }
    });
  }

  // Stepper navigation
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    } else {
      this.onSubmit();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep || this.validateStepsUpTo(step - 1)) {
      this.currentStep = step;
    }
  }

  validateCurrentStep(): boolean {
    const controls = this.getStepControls(this.currentStep);
    let isValid = true;

    controls.forEach(controlName => {
      const control = this.deviceForm.get(controlName);
      if (control) {
        control.markAsTouched();
        if (control.invalid) {
          isValid = false;
        }
      }
    });

    return isValid;
  }

  validateStepsUpTo(step: number): boolean {
    for (let i = 1; i <= step; i++) {
      if (!this.validateStep(i)) {
        return false;
      }
    }
    return true;
  }

  validateStep(step: number): boolean {
    const controls = this.getStepControls(step);
    return controls.every(controlName => {
      const control = this.deviceForm.get(controlName);
      return control ? control.valid : true;
    });
  }

  getStepControls(step: number): string[] {
    switch (step) {
      case 1:
        return ['name', 'category'];
      case 2:
        return ['purchaseDate', 'warrantyExpires'];
      case 3:
        return [];
      default:
        return [];
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.deviceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  onSubmit(): void {
    if (this.deviceForm.invalid) {
      Object.keys(this.deviceForm.controls).forEach(key => {
        this.deviceForm.get(key)?.markAsTouched();
      });
      this.error = 'Please fill in all required fields';
      return;
    }

    // Validate dates
    const formValue = this.deviceForm.value;
    if (formValue.warrantyExpires && formValue.purchaseDate) {
      if (new Date(formValue.warrantyExpires) < new Date(formValue.purchaseDate)) {
        this.error = 'Warranty expiration must be after purchase date';
        return;
      }
    }

    this.isSubmitting = true;
    this.error = '';

    this.deviceService.createDevice(formValue).subscribe({
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
    this.deviceForm.reset();
    this.currentStep = 1;
    this.error = '';
    this.isSubmitting = false;
  }
}
