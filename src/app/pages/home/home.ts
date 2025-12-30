import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button';
import { LoginDialogComponent } from '../../shared/components/login-dialog/login-dialog';
import { SignupDialogComponent } from '../../shared/components/signup-dialog/signup-dialog';
import { DeviceService, Device } from '../../core/services/device.service';
import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, LoginDialogComponent, SignupDialogComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  // Stepper state
  currentStep = 1;
  totalSteps = 3;

  // Forms
  deviceForm: FormGroup;

  // Data
  devices: Device[] = [];
  isLoading = false;
  isSaving = false;

  // Auth dialogs
  isLoginDialogOpen = false;
  isSignupDialogOpen = false;
  pendingDeviceData: any = null;

  // Categories
  categories = [
    { value: 'Laptop', label: 'Laptop 💻' },
    { value: 'Smartphone', label: 'Smartphone 📱' },
    { value: 'Tablet', label: 'Tablet 📱' },
    { value: 'Headphones', label: 'Headphones 🎧' },
    { value: 'Smartwatch', label: 'Smartwatch ⌚' },
    { value: 'Camera', label: 'Camera 📷' },
    { value: 'Speaker', label: 'Speaker 🔊' },
    { value: 'TV', label: 'TV 📺' },
    { value: 'Monitor', label: 'Monitor 🖥️' },
    { value: 'Other', label: 'Other 📦' }
  ];

  constructor(
    private fb: FormBuilder,
    private deviceService: DeviceService,
    public documentService: DocumentService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
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
  }

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.isLoading = true;
    this.deviceService.devices$.subscribe({
      next: (devices) => {
        this.devices = devices.slice(0, 5); // Show only 5 recent devices
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.isLoading = false;
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
      this.submitDevice();
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

  submitDevice(): void {
    if (this.deviceForm.invalid) {
      Object.keys(this.deviceForm.controls).forEach(key => {
        this.deviceForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      // Store the form data and show login dialog
      this.pendingDeviceData = this.deviceForm.value;
      this.isLoginDialogOpen = true;
      return;
    }

    // User is authenticated, proceed with creation
    this.performDeviceCreation(this.deviceForm.value);
  }

  private performDeviceCreation(deviceData: any): void {
    this.isSaving = true;

    this.deviceService.createDevice(deviceData).subscribe({
      next: (result) => {
        if (result.success) {
          this.deviceForm.reset();
          this.currentStep = 1;
          this.isSaving = false;
          // Reload the page to show the newly created device
          window.location.reload();
        } else {
          alert('Failed to create device: ' + (result.error || 'Unknown error'));
          this.isSaving = false;
        }
      },
      error: (error) => {
        console.error('Error creating device:', error);
        alert('Failed to create device');
        this.isSaving = false;
      }
    });
  }

  // Device actions
  viewDevice(device: Device): void {
    this.router.navigate(['/dashboard'], {
      queryParams: { deviceId: device.id }
    });
  }

  editDevice(device: Device): void {
    // Populate form with device data
    this.deviceForm.patchValue({
      name: device.name,
      category: device.category,
      manufacturer: device.manufacturer,
      model: device.model,
      purchaseDate: device.purchaseDate,
      purchasePrice: device.purchasePrice,
      warrantyExpires: device.warrantyExpires,
      warrantyProvider: device.warrantyProvider,
      serialNumber: device.serialNumber,
      notes: device.notes
    });
    this.currentStep = 1;
  }

  deleteDevice(device: Device): void {
    if (confirm(`Are you sure you want to delete "${device.name}"?`)) {
      this.deviceService.deleteDevice(device.id).subscribe({
        next: (result) => {
          if (result.success) {
            this.loadDevices();
          } else {
            alert('Failed to delete device: ' + (result.error || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error deleting device:', error);
          alert('Failed to delete device');
        }
      });
    }
  }

  viewDocuments(device: Device): void {
    this.router.navigate(['/dashboard'], {
      queryParams: { deviceId: device.id, view: 'documents' }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'expiring-soon':
        return 'status-warning';
      case 'expired':
        return 'status-expired';
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.deviceForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Auth dialog handlers
  onLoginSuccess(): void {
    // Close the dialog immediately
    this.isLoginDialogOpen = false;
    this.cdr.detectChanges();

    // User successfully logged in, create the device if there's pending data
    if (this.pendingDeviceData) {
      this.performDeviceCreation(this.pendingDeviceData);
      this.pendingDeviceData = null;
    }
  }

  onSignupSuccess(): void {
    // Close the dialog immediately
    this.isSignupDialogOpen = false;
    this.cdr.detectChanges();

    // User successfully signed up, create the device if there's pending data
    if (this.pendingDeviceData) {
      this.performDeviceCreation(this.pendingDeviceData);
      this.pendingDeviceData = null;
    }
  }

  closeLoginDialog(): void {
    this.isLoginDialogOpen = false;
    // Clear pending data if user cancels login
    if (!this.authService.isAuthenticated()) {
      this.pendingDeviceData = null;
    }
  }

  closeSignupDialog(): void {
    this.isSignupDialogOpen = false;
    // Clear pending data if user cancels signup
    if (!this.authService.isAuthenticated()) {
      this.pendingDeviceData = null;
    }
  }

  switchToSignup(): void {
    this.isLoginDialogOpen = false;
    this.isSignupDialogOpen = true;
  }

  switchToLogin(): void {
    this.isSignupDialogOpen = false;
    this.isLoginDialogOpen = true;
  }
}
