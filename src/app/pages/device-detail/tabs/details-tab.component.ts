import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../core/services/device.service';
import { FieldConfig } from '../../../core/services/rbac.service';

@Component({
  selector: 'app-details-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './details-tab.component.html',
  styleUrl: './details-tab.component.scss'
})
export class DetailsTabComponent {
  @Input() device: Device | null = null;
  @Input() fieldConfigs: { [key: string]: FieldConfig } = {};
  @Input() loadingFieldConfigs: boolean = false;
  @Input() isUpdating: boolean = false;
  @Output() fieldUpdate = new EventEmitter<{ field: string; value: any; reason?: string }>();

  editMode: { [key: string]: boolean } = {};
  editValues: { [key: string]: any } = {};

  // Fields displayed in Details tab
  detailFields = ['name', 'manufacturer', 'model', 'category', 'serialNumber', 'status'];

  constructor(private cdr: ChangeDetectorRef) {}

  isFieldEditable(field: string): boolean {
    if (this.loadingFieldConfigs || this.isUpdating) {
      return false;
    }

    const config = this.fieldConfigs[field];
    if (!config) {
      return false;
    }

    // For enum fields, ensure we have allowed values
    if (config.type === 'enum') {
      return !!(config.allowedValues && config.allowedValues.length > 0);
    }

    return true;
  }

  enterEditMode(field: string): void {
    if (!this.device || this.isUpdating || !this.isFieldEditable(field)) return;

    let value = this.device[field as keyof Device];

    this.editValues[field] = value;
    this.editMode[field] = true;
    this.cdr.detectChanges();
  }

  cancelEdit(field: string): void {
    delete this.editMode[field];
    delete this.editValues[field];
    this.cdr.detectChanges();
  }

  saveField(field: string): void {
    if (!this.device || this.isUpdating) return;

    const newValue = this.editValues[field];
    const oldValue = this.device[field as keyof Device];

    // Check if value changed
    if (newValue === oldValue) {
      this.cancelEdit(field);
      return;
    }

    // Exit edit mode
    delete this.editMode[field];
    delete this.editValues[field];

    // Emit update event to parent
    this.fieldUpdate.emit({
      field,
      value: newValue,
      reason: `Updated ${this.formatFieldName(field)} via web interface`
    });

    this.cdr.detectChanges();
  }

  formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  formatFieldValue(field: string): string {
    if (!this.device) return '-';

    const value = this.device[field as keyof Device];

    if (value === null || value === undefined || value === '') {
      return '-';
    }

    // Format based on field type
    const config = this.fieldConfigs[field];

    if (config?.type === 'date') {
      return this.formatDate(value as string);
    }

    if (config?.type === 'enum') {
      return this.formatEnumValue(value as string);
    }

    return String(value);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return '-';
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  formatEnumValue(value: string): string {
    if (!value) return '-';
    return value
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'status-active',
      'in_use': 'status-active',
      'inactive': 'status-inactive',
      'storage': 'status-storage',
      'in_storage': 'status-storage',
      'maintenance': 'status-maintenance',
      'in_maintenance': 'status-maintenance',
      'repair': 'status-repair',
      'disposed': 'status-disposed',
      'sold': 'status-sold',
      'lost': 'status-lost'
    };

    return statusClasses[status?.toLowerCase()] || 'status-default';
  }
}
