import { Component, EventEmitter, Input, Output, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DeviceService } from '../../../core/services/device.service';
import { PhotoAnalysisService, PhotoAnalysisResponse } from '../../../core/services/photo-analysis.service';

@Component({
  selector: 'gc-add-device-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  templateUrl: './add-device-dialog.html',
  styleUrl: './add-device-dialog.scss'
})
export class AddDeviceDialogComponent implements OnDestroy {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() deviceAdded = new EventEmitter<void>();

  // Creation mode
  creationMode: 'photo' | 'manual' = 'manual';

  // Stepper state (0 = method choice, 1-3 = form steps)
  currentStep = 0;
  totalSteps = 3;

  // Photo analysis state
  isAnalyzing = false;
  analysisResult: PhotoAnalysisResponse | null = null;
  analysisError: string | null = null;
  capturedPhoto: File | null = null;
  photoPreviewUrl: string | null = null;

  // Confidence thresholds
  readonly CONFIDENCE_THRESHOLD_HIGH = 0.8;
  readonly CONFIDENCE_THRESHOLD_MEDIUM = 0.5;

  // Form
  deviceForm: FormGroup;

  // Categories
  categories: Array<{value: string; label: string; emoji: string}> = [];

  // State
  isSubmitting = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private deviceService: DeviceService,
    private photoAnalysisService: PhotoAnalysisService,
    private cdr: ChangeDetectorRef
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
      case 0:
        return []; // Step 0 = method choice, no validation
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

  // Photo mode methods
  onMethodSelect(mode: 'photo' | 'manual'): void {
    this.creationMode = mode;
    if (mode === 'manual') {
      this.currentStep = 1; // Skip to Step 1
    }
  }

  onPhotoCapture(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.capturedPhoto = file;
      this.photoPreviewUrl = URL.createObjectURL(file);
      this.analyzePhoto(file);
    }
  }

  async analyzePhoto(file: File): Promise<void> {
    this.isAnalyzing = true;
    this.analysisError = null;
    this.cdr.markForCheck();

    try {
      const result = await firstValueFrom(
        this.photoAnalysisService.analyzePhoto(file, this.deviceForm.get('category')?.value)
      );

      this.analysisResult = result;

      if (result.status === 'success' || result.status === 'partial') {
        this.preFillFormFromAnalysis(result);
        this.currentStep = 1; // Move to Step 1 for review
      } else {
        this.analysisError = 'Could not extract information from photo. Please enter details manually.';
        this.creationMode = 'manual';
        this.currentStep = 1;
      }
    } catch (error) {
      this.analysisError = 'Photo analysis failed. Please enter details manually.';
      this.creationMode = 'manual';
      this.currentStep = 1;
      console.error('Photo analysis error:', error);
    } finally {
      this.isAnalyzing = false;
      this.cdr.markForCheck();
    }
  }

  preFillFormFromAnalysis(result: PhotoAnalysisResponse): void {
    const { extractedData } = result;

    // Pre-fill manufacturer (brand)
    if (extractedData.brand && this.hasHighConfidence(extractedData.confidence.brand)) {
      this.deviceForm.patchValue({ manufacturer: extractedData.brand });
    }

    // Pre-fill model
    if (extractedData.model && this.hasHighConfidence(extractedData.confidence.model)) {
      this.deviceForm.patchValue({ model: extractedData.model });
    }

    // Pre-fill serial number
    if (extractedData.serialNumber && this.hasHighConfidence(extractedData.confidence.serialNumber)) {
      this.deviceForm.patchValue({ serialNumber: extractedData.serialNumber });
    }

    // Suggest category if available
    if (extractedData.suggestedCategory) {
      this.deviceForm.patchValue({ category: extractedData.suggestedCategory });
    }

    this.cdr.markForCheck();
  }

  hasHighConfidence(score: number): boolean {
    return score >= this.CONFIDENCE_THRESHOLD_HIGH;
  }

  getConfidenceLabel(score: number): string {
    if (score >= this.CONFIDENCE_THRESHOLD_HIGH) return 'high';
    if (score >= this.CONFIDENCE_THRESHOLD_MEDIUM) return 'medium';
    return 'low';
  }

  retakePhoto(): void {
    this.capturedPhoto = null;
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
    this.photoPreviewUrl = null;
    this.analysisResult = null;
    this.analysisError = null;
    this.currentStep = 0;
    this.cdr.markForCheck();
  }

  switchToManual(): void {
    this.creationMode = 'manual';
    this.currentStep = 1;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
  }

  private resetForm(): void {
    this.deviceForm.reset();
    this.currentStep = 0;
    this.error = '';
    this.isSubmitting = false;
    this.creationMode = 'manual';
    this.analysisResult = null;
    this.analysisError = null;
    this.capturedPhoto = null;
    if (this.photoPreviewUrl) {
      URL.revokeObjectURL(this.photoPreviewUrl);
    }
    this.photoPreviewUrl = null;
  }
}
