import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService, User } from '../../core/services/auth.service';
import { DeviceService, Device } from '../../core/services/device.service';
import { AddDeviceDialogComponent } from '../../shared/components/device-dialogs/add-device-dialog';
import { QuickAddDeviceDialogComponent } from '../../shared/components/device-dialogs/quick-add-device-dialog';
import { DeleteDeviceDialogComponent } from '../../shared/components/device-dialogs/delete-device-dialog';
import { UploadDocumentDialogComponent } from '../../shared/components/document-dialogs/upload-document-dialog';
import { ViewDocumentsDialogComponent } from '../../shared/components/document-dialogs/view-documents-dialog';
import { DeleteDocumentDialogComponent } from '../../shared/components/document-dialogs/delete-document-dialog';
import { DocumentService, GenericDocument } from '../../core/services/document.service';
import { BulkActionBarComponent } from '../../shared/components/bulk-action-bar/bulk-action-bar';
import { CreateServiceRequestDialogComponent, ServiceRequestData } from '../../shared/components/service-request-dialogs/create-service-request-dialog';
import { BulkImportDialogComponent } from '../../shared/components/device-dialogs/bulk-import-dialog';
import { BulkImportResult } from '../../core/services/bulk-import.service';
import { CardComponent } from '../../shared/components/card/card';
import { BadgeComponent } from '../../shared/components/badge/badge';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    AddDeviceDialogComponent,
    QuickAddDeviceDialogComponent,
    DeleteDeviceDialogComponent,
    UploadDocumentDialogComponent,
    ViewDocumentsDialogComponent,
    DeleteDocumentDialogComponent,
    BulkActionBarComponent,
    CreateServiceRequestDialogComponent,
    BulkImportDialogComponent,
    CardComponent,
    BadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  templateUrl: './devices.html',
  styleUrl: './devices.scss'
})
export class DevicesComponent implements OnInit, OnDestroy {
  user: User | null = null;
  devices: Device[] = [];
  filteredDevices: Device[] = [];
  isLoading = true;
  searchTerm = '';
  selectedCategory = 'all';
  selectedStatus = 'all';

  // Dialog states
  isAddDialogOpen = false;
  isQuickAddDialogOpen = false;
  isDeleteDialogOpen = false;
  selectedDevice: Device | null = null;

  // Document dialog states
  isUploadDocumentDialogOpen = false;
  isViewDocumentsDialogOpen = false;
  isDeleteDocumentDialogOpen = false;
  selectedDocument: GenericDocument | null = null;
  selectedDeviceForDocs: Device | null = null;

  // Service request dialog state
  isServiceRequestDialogOpen = false;
  selectedDeviceForServiceRequest: Device | null = null;

  // Bulk import dialog state
  isBulkImportDialogOpen = false;

  // Bulk selection state
  selectedDeviceIds: Set<string> = new Set();

  private subscriptions = new Subscription();

  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'phone', label: 'Phone' },
    { value: 'laptop', label: 'Laptop' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'watch', label: 'Watch' },
    { value: 'camera', label: 'Camera' },
    { value: 'other', label: 'Other' }
  ];

  statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active Warranty' },
    { value: 'expiring-soon', label: 'Expiring Soon' },
    { value: 'expired', label: 'Expired' },
    { value: 'no-warranty', label: 'No Warranty' }
  ];

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private documentService: DocumentService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/']);
      return;
    }

    this.loadDevices();
  }

  // Stats calculations
  getStats() {
    const total = this.devices.length;
    const active = this.devices.filter(d => d.status === 'active').length;
    const expiringSoon = this.devices.filter(d => d.status === 'expiring-soon').length;
    const expired = this.devices.filter(d => d.status === 'expired').length;
    const noWarranty = this.devices.filter(d => d.status === 'no-warranty').length;

    return {
      total,
      active,
      expiringSoon,
      expired,
      noWarranty
    };
  }

  private loadDevices(): void {
    const devicesSub = this.deviceService.devices$.subscribe({
      next: (devices) => {
        this.devices = devices;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(devicesSub);

    this.deviceService.getDevices().subscribe({
      error: (error) => {
        console.error('Error fetching devices:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  applyFilters(): void {
    this.filteredDevices = this.devices.filter(device => {
      const matchesSearch = !this.searchTerm ||
        device.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        device.manufacturer?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        device.model?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory = this.selectedCategory === 'all' || device.category === this.selectedCategory;
      const matchesStatus = this.selectedStatus === 'all' || device.status === this.selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
    this.cdr.detectChanges();
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onCategoryChange(event: Event): void {
    this.selectedCategory = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onStatusChange(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'expiring-soon':
        return 'status-warning';
      case 'expired':
        return 'status-expired';
      case 'no-warranty':
        return 'status-none';
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
      case 'no-warranty':
        return 'No Warranty';
      default:
        return status;
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'phone':
        return '📱';
      case 'laptop':
        return '💻';
      case 'tablet':
        return '📱';
      case 'watch':
        return '⌚';
      case 'camera':
        return '📷';
      default:
        return '📦';
    }
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Navigation methods
  viewDevice(device: Device): void {
    this.router.navigate(['/my-gadgets', device.id]);
  }

  raiseRepairRequest(device: Device): void {
    this.selectedDeviceForServiceRequest = device;
    this.isServiceRequestDialogOpen = true;
  }

  closeServiceRequestDialog(): void {
    this.isServiceRequestDialogOpen = false;
    this.selectedDeviceForServiceRequest = null;
  }

  onServiceRequestCreated(requestData: ServiceRequestData): void {
    console.log('Service request created:', requestData);
    // TODO: Implement actual API call to create service request
    // For now, just show success message
    alert(`Service request created successfully!\n\nDevice: ${requestData.deviceName}\nType: ${requestData.requestType}\nPriority: ${requestData.priority}\nSubject: ${requestData.subject}`);
    this.cdr.detectChanges();
  }

  // Bulk import methods
  openBulkImportDialog(): void {
    this.isBulkImportDialogOpen = true;
  }

  closeBulkImportDialog(): void {
    this.isBulkImportDialogOpen = false;
  }

  onBulkImportComplete(result: BulkImportResult): void {
    console.log('Bulk import completed:', result);

    // Show success message
    if (result.success) {
      alert(`Successfully imported ${result.summary.createdItems} gadgets!`);

      // Refresh device list - fetch fresh data and update component state
      this.deviceService.getDevices().subscribe({
        next: (devices) => {
          console.log(`Devices refreshed after bulk import: ${devices.length} devices`);
          this.devices = devices;
          this.applyFilters();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error refreshing devices after bulk import:', error);
        }
      });
    }

    // Close dialog
    this.closeBulkImportDialog();
  }

  // Dialog methods
  openAddDialog(): void {
    this.isAddDialogOpen = true;
  }

  openQuickAddDialog(): void {
    this.isQuickAddDialogOpen = true;
  }

  openDeleteDialog(device: Device): void {
    this.selectedDevice = device;
    this.isDeleteDialogOpen = true;
  }

  closeAddDialog(): void {
    this.isAddDialogOpen = false;
  }

  closeQuickAddDialog(): void {
    this.isQuickAddDialogOpen = false;
  }

  closeDeleteDialog(): void {
    this.isDeleteDialogOpen = false;
    this.selectedDevice = null;
  }

  onDeviceAdded(): void {
    console.log('Device added successfully');
    this.cdr.detectChanges();
  }

  onQuickDeviceAdded(): void {
    console.log('Device added via quick add successfully');
    this.cdr.detectChanges();
  }

  onDeviceDeleted(): void {
    console.log('Device deleted successfully');
    this.cdr.detectChanges();
  }

  // Document dialog methods
  openUploadDocumentDialog(device: Device): void {
    this.selectedDeviceForDocs = device;
    this.isUploadDocumentDialogOpen = true;
  }

  openViewDocumentsDialog(device: Device): void {
    this.selectedDeviceForDocs = device;
    this.isViewDocumentsDialogOpen = true;
  }

  openDocumentsDialog(device: Device): void {
    // Combined documents dialog - opens view documents which includes upload functionality
    this.selectedDeviceForDocs = device;
    this.isViewDocumentsDialogOpen = true;
  }

  openDeleteDocumentDialog(document: GenericDocument): void {
    this.selectedDocument = document;
    this.isDeleteDocumentDialogOpen = true;
  }

  closeUploadDocumentDialog(): void {
    this.isUploadDocumentDialogOpen = false;
    this.selectedDeviceForDocs = null;
  }

  closeViewDocumentsDialog(): void {
    this.isViewDocumentsDialogOpen = false;
    this.selectedDeviceForDocs = null;
  }

  closeDeleteDocumentDialog(): void {
    this.isDeleteDocumentDialogOpen = false;
    this.selectedDocument = null;
  }

  onDocumentUploaded(): void {
    console.log('Document uploaded successfully');
    this.cdr.detectChanges();
  }

  onDocumentDeleted(): void {
    console.log('Document deleted successfully');
    this.cdr.detectChanges();
  }

  onUploadNewFromViewDialog(): void {
    const device = this.selectedDeviceForDocs;
    this.closeViewDocumentsDialog();
    if (device) {
      this.openUploadDocumentDialog(device);
    }
  }

  // Bulk selection methods
  toggleDeviceSelection(deviceId: string): void {
    if (this.selectedDeviceIds.has(deviceId)) {
      this.selectedDeviceIds.delete(deviceId);
    } else {
      this.selectedDeviceIds.add(deviceId);
    }
    this.cdr.detectChanges();
  }

  isDeviceSelected(deviceId: string): boolean {
    return this.selectedDeviceIds.has(deviceId);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.selectedDeviceIds.clear();
    } else {
      this.filteredDevices.forEach(device => {
        this.selectedDeviceIds.add(device.id);
      });
    }
    this.cdr.detectChanges();
  }

  isAllSelected(): boolean {
    return this.filteredDevices.length > 0 &&
           this.filteredDevices.every(device => this.selectedDeviceIds.has(device.id));
  }

  isSomeSelected(): boolean {
    return this.selectedDeviceIds.size > 0 && !this.isAllSelected();
  }

  getSelectedCount(): number {
    return this.selectedDeviceIds.size;
  }

  clearSelection(): void {
    this.selectedDeviceIds.clear();
    this.cdr.detectChanges();
  }

  // Bulk action handlers
  onBulkDelete(): void {
    const selectedIds = Array.from(this.selectedDeviceIds);
    let successCount = 0;
    let errorCount = 0;

    // Delete each selected device
    selectedIds.forEach((deviceId, index) => {
      this.deviceService.deleteDevice(deviceId).subscribe({
        next: (result) => {
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }

          // After all deletes complete
          if (index === selectedIds.length - 1) {
            if (successCount > 0) {
              alert(`Successfully deleted ${successCount} gadget${successCount > 1 ? 's' : ''}`);
            }
            if (errorCount > 0) {
              alert(`Failed to delete ${errorCount} gadget${errorCount > 1 ? 's' : ''}`);
            }
            this.clearSelection();
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          errorCount++;
          console.error('Error deleting device:', error);

          // After all deletes complete
          if (index === selectedIds.length - 1) {
            if (successCount > 0) {
              alert(`Successfully deleted ${successCount} gadget${successCount > 1 ? 's' : ''}`);
            }
            if (errorCount > 0) {
              alert(`Failed to delete ${errorCount} gadget${errorCount > 1 ? 's' : ''}`);
            }
            this.clearSelection();
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  onBulkChangeStatus(newStatus: string): void {
    const selectedIds = Array.from(this.selectedDeviceIds);
    let successCount = 0;
    let errorCount = 0;

    // Update status for each selected device
    selectedIds.forEach((deviceId, index) => {
      const device = this.devices.find(d => d.id === deviceId);
      if (device) {
        const updatedDevice = { id: deviceId, status: newStatus };
        this.deviceService.updateDevice(updatedDevice).subscribe({
          next: (result) => {
            if (result) {
              successCount++;
            } else {
              errorCount++;
            }

            // After all updates complete
            if (index === selectedIds.length - 1) {
              if (successCount > 0) {
                alert(`Successfully updated status for ${successCount} gadget${successCount > 1 ? 's' : ''}`);
              }
              if (errorCount > 0) {
                alert(`Failed to update ${errorCount} gadget${errorCount > 1 ? 's' : ''}`);
              }
              this.clearSelection();
              this.cdr.detectChanges();
            }
          },
          error: (error) => {
            errorCount++;
            console.error('Error updating device status:', error);

            // After all updates complete
            if (index === selectedIds.length - 1) {
              if (successCount > 0) {
                alert(`Successfully updated status for ${successCount} gadget${successCount > 1 ? 's' : ''}`);
              }
              if (errorCount > 0) {
                alert(`Failed to update ${errorCount} gadget${errorCount > 1 ? 's' : ''}`);
              }
              this.clearSelection();
              this.cdr.detectChanges();
            }
          }
        });
      }
    });
  }
}
