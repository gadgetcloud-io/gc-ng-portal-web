import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeviceService, Device } from '../../core/services/device.service';
import { RbacService, FieldConfig, FieldUpdateRequest } from '../../core/services/rbac.service';

@Component({
  selector: 'gc-device-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './device-detail.html',
  styleUrls: ['./device-detail.scss']
})
export class DeviceDetailComponent implements OnInit {
  deviceId: string = '';
  device: Device | null = null;
  loading = true;
  error: string | null = null;

  // Edit mode state
  editMode: { [field: string]: boolean } = {};
  editValues: { [field: string]: any } = {};
  fieldConfigs: { [field: string]: FieldConfig } = {};
  isUpdating = false;
  updateError: string | null = null;
  updateSuccess: string | null = null;
  loadingFieldConfigs = false;

  // Editable fields for gc-items collection
  editableFields = [
    'name',
    'manufacturer',
    'model',
    'serialNumber',
    'category',
    'status',
    'purchaseDate',
    'warrantyExpires',
    'purchasePrice',
    'warrantyProvider',
    'notes'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deviceService: DeviceService,
    private rbacService: RbacService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get device ID from route params
    this.deviceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.deviceId) {
      this.loadDevice();
      this.loadFieldConfigs();
    } else {
      this.error = 'No device ID provided';
      this.loading = false;
    }
  }

  /**
   * Load device details
   */
  private loadDevice(): void {
    this.loading = true;
    this.error = null;

    this.deviceService.getDeviceById(this.deviceId).subscribe({
      next: (device) => {
        if (device) {
          this.device = device;
        } else {
          this.error = 'Device not found';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading device:', err);
        this.error = 'Failed to load device details';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Get device image/icon
   */
  getDeviceIcon(): string {
    if (!this.device) return '📦';
    return this.device.image || this.getCategoryIcon(this.device.category);
  }

  /**
   * Get icon based on category
   */
  private getCategoryIcon(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'laptop': '💻',
      'phone': '📱',
      'smartphone': '📱',
      'tablet': '📱',
      'watch': '⌚',
      'smartwatch': '⌚',
      'camera': '📷',
      'other': '📦'
    };
    return categoryMap[category?.toLowerCase()] || '📦';
  }

  /**
   * Get status badge class
   */
  getStatusClass(): string {
    if (!this.device) return '';

    switch (this.device.status) {
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

  /**
   * Get status display text
   */
  getStatusText(): string {
    if (!this.device) return '';

    switch (this.device.status) {
      case 'active':
        return 'Active Warranty';
      case 'expiring-soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Warranty Expired';
      default:
        return this.device.status;
    }
  }

  /**
   * Format currency
   */
  formatCurrency(value: number | undefined): string {
    if (!value) return 'N/A';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format date
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Navigate to edit mode (future implementation)
   */
  editDevice(): void {
    // Future: Open inline edit mode or edit dialog
    console.log('Edit device:', this.deviceId);
  }

  /**
   * Delete device
   */
  async deleteDevice(): Promise<void> {
    if (!confirm('Are you sure you want to delete this gadget? This action cannot be undone.')) {
      return;
    }

    this.deviceService.deleteDevice(this.deviceId).subscribe({
      next: (result) => {
        if (result.success) {
          alert('Gadget deleted successfully');
          this.router.navigate(['/my-gadgets']);
        } else {
          alert(result.error || 'Failed to delete gadget');
        }
      },
      error: (err) => {
        console.error('Error deleting device:', err);
        alert('Failed to delete gadget');
      }
    });
  }

  /**
   * Load field configurations from RBAC API
   */
  private loadFieldConfigs(): void {
    this.loadingFieldConfigs = true;

    this.rbacService.getFieldConfig('gc-items').subscribe({
      next: (configs) => {
        this.fieldConfigs = configs;
        this.loadingFieldConfigs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading field configs:', err);
        this.loadingFieldConfigs = false;
        // Field configs are optional, so don't show error to user
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Check if a field is editable
   */
  isFieldEditable(field: string): boolean {
    return this.editableFields.includes(field) && !this.loadingFieldConfigs;
  }

  /**
   * Enter edit mode for a field
   */
  enterEditMode(field: string): void {
    if (!this.device || this.isUpdating) return;

    // Store current value
    this.editValues[field] = this.device[field as keyof Device];
    this.editMode[field] = true;
    this.updateError = null;
    this.updateSuccess = null;
    this.cdr.detectChanges();
  }

  /**
   * Cancel edit mode for a field
   */
  cancelEdit(field: string): void {
    delete this.editMode[field];
    delete this.editValues[field];
    this.updateError = null;
    this.cdr.detectChanges();
  }

  /**
   * Save field update via RBAC API
   */
  saveField(field: string, reason?: string): void {
    if (!this.device || this.isUpdating) return;

    const newValue = this.editValues[field];
    const oldValue = this.device[field as keyof Device];

    // Check if value changed
    if (newValue === oldValue) {
      this.cancelEdit(field);
      return;
    }

    // Validate field value
    const fieldConfig = this.fieldConfigs[field];
    if (fieldConfig) {
      const validation = this.rbacService.validateFieldValue(newValue, fieldConfig);
      if (!validation.valid) {
        this.updateError = validation.error || 'Invalid value';
        this.cdr.detectChanges();
        return;
      }
    }

    // Prepare update request
    const updateRequest: FieldUpdateRequest = {
      collection: 'gc-items',
      documentId: this.deviceId,
      field: field,
      value: newValue,
      reason: reason
    };

    // Update field via RBAC API
    this.isUpdating = true;
    this.updateError = null;
    this.updateSuccess = null;

    this.rbacService.updateField(updateRequest).subscribe({
      next: (response) => {
        console.log('Field updated successfully:', response);

        // Update local device data
        if (this.device) {
          (this.device as any)[field] = response.newValue;
        }

        // Exit edit mode
        delete this.editMode[field];
        delete this.editValues[field];

        // Show success message
        this.updateSuccess = `${this.formatFieldName(field)} updated successfully`;
        this.isUpdating = false;

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          this.updateSuccess = null;
          this.cdr.detectChanges();
        }, 3000);

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating field:', err);
        this.updateError = err.message || 'Failed to update field';
        this.isUpdating = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Get input type for a field based on its configuration
   */
  getFieldType(field: string): string {
    const config = this.fieldConfigs[field];
    if (!config) return 'text';

    switch (config.type) {
      case 'number':
        return 'number';
      case 'date':
        return 'date';
      case 'enum':
        return 'select';
      case 'boolean':
        return 'checkbox';
      default:
        return 'text';
    }
  }

  /**
   * Get allowed values for enum fields
   */
  getAllowedValues(field: string): string[] {
    const config = this.fieldConfigs[field];
    return config?.allowedValues || [];
  }

  /**
   * Format field name for display
   */
  formatFieldName(field: string): string {
    // Convert camelCase to Title Case
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Get formatted field value for display
   */
  getFieldDisplayValue(field: string): string {
    if (!this.device) return 'N/A';

    const value = this.device[field as keyof Device];
    const config = this.fieldConfigs[field];

    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }

    // Special handling for certain fields
    if (field === 'purchasePrice') {
      return this.formatCurrency(value as number);
    }

    if (field === 'purchaseDate' || field === 'warrantyExpires') {
      return this.formatDate(value as string);
    }

    if (config) {
      return this.rbacService.formatFieldValue(value, config);
    }

    return String(value);
  }

  /**
   * Check if any field is currently in edit mode
   */
  isAnyFieldInEditMode(): boolean {
    return Object.keys(this.editMode).some(key => this.editMode[key]);
  }

  /**
   * Convert date string to YYYY-MM-DD format for date input
   */
  formatDateForInput(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
}
