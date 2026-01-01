import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Device } from '../../../core/services/device.service';
import { FieldConfig } from '../../../core/services/rbac.service';
import { WarrantyTimelineComponent } from '../components/warranty-timeline.component';

@Component({
  selector: 'app-warranty-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, WarrantyTimelineComponent],
  templateUrl: './warranty-tab.component.html',
  styleUrl: './warranty-tab.component.scss'
})
export class WarrantyTabComponent {
  @Input() device: Device | null = null;
  @Input() fieldConfigs: { [key: string]: FieldConfig } = {};
  @Input() loadingFieldConfigs: boolean = false;
  @Input() isUpdating: boolean = false;
  @Output() fieldUpdate = new EventEmitter<{ field: string; value: any; reason?: string }>();

  editMode: { [key: string]: boolean } = {};
  editValues: { [key: string]: any } = {};

  // Fields displayed in Warranty tab
  warrantyFields = ['purchaseDate', 'purchasePrice', 'warrantyExpires', 'warrantyProvider'];

  constructor(private cdr: ChangeDetectorRef) {}

  isFieldEditable(field: string): boolean {
    if (this.loadingFieldConfigs || this.isUpdating) {
      return false;
    }

    const config = this.fieldConfigs[field];
    return !!config;
  }

  enterEditMode(field: string): void {
    if (!this.device || this.isUpdating || !this.isFieldEditable(field)) return;

    let value = this.device[field as keyof Device];

    // Format date fields for date input (YYYY-MM-DD)
    if (field === 'purchaseDate' || field === 'warrantyExpires') {
      value = this.formatDateForInput(value as string) as any;
    }

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

    // For date fields, compare the date strings (not the formatted input)
    if (field === 'purchaseDate' || field === 'warrantyExpires') {
      const oldDate = this.formatDateForInput(oldValue as string);
      if (newValue === oldDate) {
        this.cancelEdit(field);
        return;
      }
    } else if (newValue === oldValue) {
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
    if (field === 'purchaseDate' || field === 'warrantyExpires') {
      return this.formatDate(value as string);
    }

    if (field === 'purchasePrice') {
      return this.formatCurrency(value as number);
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

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
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

  get hasWarrantyDates(): boolean {
    return !!(this.device?.purchaseDate && this.device?.warrantyExpires);
  }
}
