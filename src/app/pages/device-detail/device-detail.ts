import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeviceService, Device } from '../../core/services/device.service';
import { RbacService, FieldConfig, FieldUpdateRequest } from '../../core/services/rbac.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { TabsComponent, Tab } from '../../shared/components/tabs/tabs.component';
import { DetailsTabComponent } from './tabs/details-tab.component';
import { WarrantyTabComponent } from './tabs/warranty-tab.component';
import { DocumentsTabComponent } from './tabs/documents-tab.component';
import { NotesTabComponent } from './tabs/notes-tab.component';
import { ServiceTicketsTabComponent } from './tabs/service-tickets-tab/service-tickets-tab.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'gc-device-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TabsComponent,
    DetailsTabComponent,
    WarrantyTabComponent,
    DocumentsTabComponent,
    NotesTabComponent,
    ServiceTicketsTabComponent
  ],
  templateUrl: './device-detail.html',
  styleUrls: ['./device-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DeviceDetailComponent implements OnInit {
  deviceId: string = '';
  device: Device | null = null;
  loading = true;
  error: string | null = null;

  // Tab state
  activeTabId: string = 'details';
  tabs: Tab[] = [
    { id: 'details', label: 'Details', icon: '📋' },
    { id: 'warranty', label: 'Warranty', icon: '🛡️' },
    { id: 'documents', label: 'Documents', icon: '📁' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'service-tickets', label: 'Service Tickets', icon: '🔧' }
  ];

  // RBAC state
  fieldConfigs: { [field: string]: FieldConfig } = {};
  isUpdating = false;
  updateError: string | null = null;
  updateSuccess: string | null = null;
  loadingFieldConfigs = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deviceService: DeviceService,
    private rbacService: RbacService,
    private breadcrumbService: BreadcrumbService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get device ID from route params
    this.deviceId = this.route.snapshot.paramMap.get('id') || '';

    // Get tab from query params
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam && this.tabs.some(t => t.id === tabParam)) {
      this.activeTabId = tabParam;
    }

    if (this.deviceId) {
      // Parallelize API calls for faster loading
      this.loadDeviceAndConfigs();
    } else {
      this.error = 'No device ID provided';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle tab change
   */
  onTabChange(tabId: string): void {
    this.activeTabId = tabId;

    // Update URL with query param (optional - for shareable URLs)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabId },
      queryParamsHandling: 'merge'
    });
  }

  /**
   * Handle field update from tab components
   */
  onFieldUpdate(event: { field: string; value: any; reason?: string }): void {
    if (!this.device || this.isUpdating) return;

    const { field, value, reason } = event;
    const oldValue = this.device[field as keyof Device];

    // Validate field value if config available
    const fieldConfig = this.fieldConfigs[field];
    if (fieldConfig) {
      const validation = this.rbacService.validateFieldValue(value, fieldConfig);
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
      value: value,
      reason: reason || `Updated ${this.formatFieldName(field)} via web interface`
    };

    // Optimistic update
    const previousValue = this.device[field as keyof Device];
    if (this.device) {
      (this.device as any)[field] = value;
    }

    // Clear any existing messages
    this.updateError = null;
    this.updateSuccess = null;
    this.cdr.detectChanges();

    // Update field via RBAC API in background
    this.rbacService.updateField(updateRequest).subscribe({
      next: (response) => {
        // Update with server response value
        if (this.device) {
          (this.device as any)[field] = response.newValue;
        }

        // Show brief success message
        this.updateSuccess = `${this.formatFieldName(field)} updated`;

        // Auto-hide success message after 1.5 seconds
        setTimeout(() => {
          this.updateSuccess = null;
          this.cdr.detectChanges();
        }, 1500);

        this.cdr.detectChanges();
      },
      error: (err) => {
        // Revert optimistic update on error
        if (this.device) {
          (this.device as any)[field] = previousValue;
        }

        this.updateError = err.message || 'Failed to update field';

        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          this.updateError = null;
          this.cdr.detectChanges();
        }, 5000);

        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load device details and field configs in parallel
   */
  private loadDeviceAndConfigs(): void {
    this.loading = true;
    this.loadingFieldConfigs = true;
    this.error = null;

    forkJoin({
      device: this.deviceService.getDeviceById(this.deviceId),
      configs: this.rbacService.getFieldConfig('gc-items')
    }).subscribe({
      next: (results) => {
        // Handle device result
        if (results.device) {
          this.device = results.device;
          // Update breadcrumb with device name
          this.breadcrumbService.setLabel(`/my-gadgets/${this.deviceId}`, results.device.name);
        } else {
          this.error = 'Device not found';
        }

        // Handle field configs result
        this.fieldConfigs = results.configs;

        this.loading = false;
        this.loadingFieldConfigs = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading device data:', err);
        this.error = 'Failed to load device details';
        this.loading = false;
        this.loadingFieldConfigs = false;
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
   * Format field name for display
   */
  formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Format currency
   */
  formatCurrency(value: number | undefined): string {
    if (!value) return '-';
    return `₹${value.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }
}
