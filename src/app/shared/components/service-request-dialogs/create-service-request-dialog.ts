import { Component, EventEmitter, Input, Output, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { Device } from '../../../core/services/device.service';

export interface ServiceRequestData {
  deviceId: string;
  deviceName: string;
  requestType: 'repair' | 'maintenance' | 'warranty-claim' | 'support';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
}

@Component({
  selector: 'gc-create-service-request-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, ButtonComponent],
  templateUrl: './create-service-request-dialog.html',
  styleUrl: './create-service-request-dialog.scss'
})
export class CreateServiceRequestDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() device: Device | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() requestCreated = new EventEmitter<ServiceRequestData>();

  requestForm: FormGroup;
  isSubmitting = false;
  error = '';

  requestTypes = [
    { value: 'repair', label: 'Repair', icon: '🔧', description: 'Fix a broken or damaged device' },
    { value: 'maintenance', label: 'Maintenance', icon: '🛠️', description: 'Regular maintenance or checkup' },
    { value: 'warranty-claim', label: 'Warranty Claim', icon: '🛡️', description: 'Claim under warranty coverage' },
    { value: 'support', label: 'Support', icon: '💬', description: 'Technical support or help' }
  ];

  priorities = [
    { value: 'low', label: 'Low', color: '#6b7280', description: 'Not urgent, can wait' },
    { value: 'medium', label: 'Medium', color: '#3b82f6', description: 'Moderate priority' },
    { value: 'high', label: 'High', color: '#f59e0b', description: 'Important, needs attention' },
    { value: 'urgent', label: 'Urgent', color: '#ef4444', description: 'Critical, immediate action required' }
  ];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.requestForm = this.fb.group({
      requestType: ['repair', [Validators.required]],
      priority: ['medium', [Validators.required]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.requestForm.reset({
      requestType: 'repair',
      priority: 'medium',
      subject: '',
      description: ''
    });
    this.isSubmitting = false;
    this.error = '';
  }

  onClose(): void {
    this.close.emit();
  }

  async onSubmit(): Promise<void> {
    if (this.requestForm.invalid || !this.device) {
      this.markFormGroupTouched(this.requestForm);
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    try {
      const formValue = this.requestForm.value;
      const requestData: ServiceRequestData = {
        deviceId: this.device.id,
        deviceName: this.device.name,
        requestType: formValue.requestType,
        priority: formValue.priority,
        subject: formValue.subject,
        description: formValue.description
      };

      // TODO: Replace with actual API call to backend
      // For now, just emit the event
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call

      this.requestCreated.emit(requestData);
      this.onClose();
    } catch (error: any) {
      console.error('Error creating service request:', error);
      this.error = error.message || 'Failed to create service request. Please try again.';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getRequestTypeIcon(type: string): string {
    const requestType = this.requestTypes.find(t => t.value === type);
    return requestType?.icon || '📋';
  }

  getPriorityColor(priority: string): string {
    const priorityObj = this.priorities.find(p => p.value === priority);
    return priorityObj?.color || '#6b7280';
  }
}
