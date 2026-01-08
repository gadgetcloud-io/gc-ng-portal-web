import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HomeDemoService, DemoDevice } from '../../services/home-demo.service';
import { PhotoAnalysisService, PhotoAnalysisResponse, ExtractedGadgetInfo } from '../../../../core/services/photo-analysis.service';

type DemoStep = 'info' | 'photo' | 'results';

interface CategoryOption {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-interactive-demo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './interactive-demo.html',
  styleUrl: './interactive-demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InteractiveDemoComponent implements OnInit, OnDestroy {
  // Step management
  currentStep: DemoStep = 'info';

  // Form
  deviceForm: FormGroup;

  // Categories
  categories: CategoryOption[] = [
    { value: 'laptop', label: 'Laptop', icon: '💻' },
    { value: 'smartphone', label: 'Smartphone', icon: '📱' },
    { value: 'tablet', label: 'Tablet', icon: '📱' },
    { value: 'smartwatch', label: 'Smartwatch', icon: '⌚' },
    { value: 'headphones', label: 'Headphones', icon: '🎧' },
    { value: 'camera', label: 'Camera', icon: '📷' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  // Photo upload
  selectedPhoto: File | null = null;
  photoPreview: string | null = null;
  isAnalyzing = false;
  analysisResult: ExtractedGadgetInfo | null = null;
  analysisError: string | null = null;

  // Results
  addedDevices: DemoDevice[] = [];

  // State subscription
  private subscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private homeDemoService: HomeDemoService,
    private photoAnalysisService: PhotoAnalysisService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize form
    this.deviceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      category: ['laptop', Validators.required],
      brand: [''],
      purchaseDate: ['', Validators.required],
      warrantyMonths: [12, [Validators.required, Validators.min(0), Validators.max(120)]],
      purchasePrice: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Subscribe to demo state to get added devices
    this.subscription = this.homeDemoService.demoState$.subscribe(state => {
      this.addedDevices = state.devices;

      // Auto-advance to results if devices exist
      if (this.addedDevices.length > 0 && this.currentStep !== 'results') {
        this.currentStep = 'results';
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // === Step Navigation ===

  goToStep(step: DemoStep): void {
    this.currentStep = step;
  }

  canGoToResults(): boolean {
    return this.addedDevices.length > 0;
  }

  // === Form Submission ===

  submitDevice(): void {
    if (this.deviceForm.valid) {
      const formValue = this.deviceForm.value;

      // Calculate warranty expiry
      const purchaseDate = new Date(formValue.purchaseDate);
      const warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setMonth(warrantyExpiry.getMonth() + formValue.warrantyMonths);

      // Add device to demo state
      this.homeDemoService.addDevice({
        name: formValue.name,
        category: formValue.category,
        brand: formValue.brand || 'Unknown',
        purchaseDate: formValue.purchaseDate,
        warrantyMonths: formValue.warrantyMonths,
        warrantyExpiry: warrantyExpiry.toISOString().split('T')[0],
        purchasePrice: formValue.purchasePrice,
        photoUrl: this.photoPreview || undefined
      });

      // Track engagement
      this.homeDemoService.trackEngagement('addDevice');

      // Reset form for next device
      this.deviceForm.reset({
        category: 'laptop',
        warrantyMonths: 12,
        purchasePrice: 0
      });
      this.selectedPhoto = null;
      this.photoPreview = null;
      this.analysisResult = null;
      this.analysisError = null;

      // Go to results
      this.currentStep = 'results';
    }
  }

  // === Photo Upload ===

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      this.selectedPhoto = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      // Track engagement
      this.homeDemoService.trackEngagement('uploadPhoto');
    }
  }

  removePhoto(): void {
    this.selectedPhoto = null;
    this.photoPreview = null;
    this.analysisResult = null;
    this.analysisError = null;
  }

  // === AI Analysis ===

  analyzePhoto(): void {
    if (!this.selectedPhoto) return;

    this.isAnalyzing = true;
    this.analysisError = null;
    this.analysisResult = null;

    const currentCategory = this.deviceForm.get('category')?.value;

    this.photoAnalysisService.analyzePhoto(this.selectedPhoto, currentCategory).subscribe({
      next: (response: PhotoAnalysisResponse) => {
        this.isAnalyzing = false;
        this.analysisResult = response.extractedData;

        // Track engagement
        this.homeDemoService.trackEngagement('uploadPhoto');

        // Trigger change detection
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isAnalyzing = false;
        this.analysisError = error.message || 'Failed to analyze photo. Please try again.';
        console.error('Photo analysis failed:', error);

        // Trigger change detection
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Apply AI-extracted data to the form
   */
  applyAnalysisToForm(): void {
    if (!this.analysisResult) return;

    const updates: any = {};

    if (this.analysisResult.brand) {
      updates.brand = this.analysisResult.brand;
    }

    if (this.analysisResult.model) {
      // Combine brand and model for name if both exist
      if (this.analysisResult.brand && this.analysisResult.model) {
        updates.name = `${this.analysisResult.brand} ${this.analysisResult.model}`;
      } else {
        updates.name = this.analysisResult.model;
      }
    }

    if (this.analysisResult.suggestedCategory) {
      updates.category = this.analysisResult.suggestedCategory;
    }

    // Apply updates to form
    this.deviceForm.patchValue(updates);

    // Go back to info step to review/edit
    this.currentStep = 'info';
  }

  // === Results Actions ===

  addAnother(): void {
    this.currentStep = 'info';
  }

  deleteDevice(deviceId: string): void {
    this.homeDemoService.removeDevice(deviceId);
  }

  resetDemo(): void {
    if (confirm('Are you sure you want to reset the demo? This will clear all added gadgets.')) {
      this.homeDemoService.resetDemo();
      this.currentStep = 'info';
      this.deviceForm.reset({
        category: 'laptop',
        warrantyMonths: 12,
        purchasePrice: 0
      });
      this.selectedPhoto = null;
      this.photoPreview = null;
    }
  }

  // === Utility Methods ===

  getCategoryIcon(category: string): string {
    const option = this.categories.find(c => c.value === category);
    return option?.icon || '📦';
  }

  isStepCompleted(step: DemoStep): boolean {
    switch (step) {
      case 'info':
        return this.deviceForm.valid;
      case 'photo':
        return this.selectedPhoto !== null;
      case 'results':
        return this.addedDevices.length > 0;
      default:
        return false;
    }
  }

  isWarrantyExpired(device: DemoDevice): boolean {
    if (!device.warrantyExpiry) return false;
    const today = new Date();
    const expiryDate = new Date(device.warrantyExpiry);
    return expiryDate < today;
  }

  isWarrantyExpiring(device: DemoDevice): boolean {
    if (!device.warrantyExpiry) return false;
    const today = new Date();
    const expiryDate = new Date(device.warrantyExpiry);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30; // Expiring within 30 days
  }
}
