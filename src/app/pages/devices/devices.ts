import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService, User } from '../../core/services/auth.service';
import { DeviceService, Device } from '../../core/services/device.service';
import { AddDeviceDialogComponent } from '../../shared/components/device-dialogs/add-device-dialog';
import { EditDeviceDialogComponent } from '../../shared/components/device-dialogs/edit-device-dialog';
import { DeleteDeviceDialogComponent } from '../../shared/components/device-dialogs/delete-device-dialog';
import { UploadDocumentDialogComponent } from '../../shared/components/document-dialogs/upload-document-dialog';
import { ViewDocumentsDialogComponent } from '../../shared/components/document-dialogs/view-documents-dialog';
import { DeleteDocumentDialogComponent } from '../../shared/components/document-dialogs/delete-document-dialog';
import { DocumentService, Document } from '../../core/services/document.service';

@Component({
  selector: 'app-devices',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    AddDeviceDialogComponent,
    EditDeviceDialogComponent,
    DeleteDeviceDialogComponent,
    UploadDocumentDialogComponent,
    ViewDocumentsDialogComponent,
    DeleteDocumentDialogComponent
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
  isEditDialogOpen = false;
  isDeleteDialogOpen = false;
  selectedDevice: Device | null = null;

  // Document dialog states
  isUploadDocumentDialogOpen = false;
  isViewDocumentsDialogOpen = false;
  isDeleteDocumentDialogOpen = false;
  selectedDocument: Document | null = null;
  selectedDeviceForDocs: Device | null = null;

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

  // Dialog methods
  openAddDialog(): void {
    this.isAddDialogOpen = true;
  }

  openEditDialog(device: Device): void {
    this.selectedDevice = device;
    this.isEditDialogOpen = true;
  }

  openDeleteDialog(device: Device): void {
    this.selectedDevice = device;
    this.isDeleteDialogOpen = true;
  }

  closeAddDialog(): void {
    this.isAddDialogOpen = false;
  }

  closeEditDialog(): void {
    this.isEditDialogOpen = false;
    this.selectedDevice = null;
  }

  closeDeleteDialog(): void {
    this.isDeleteDialogOpen = false;
    this.selectedDevice = null;
  }

  onDeviceAdded(): void {
    console.log('Device added successfully');
    this.cdr.detectChanges();
  }

  onDeviceUpdated(): void {
    console.log('Device updated successfully');
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

  openDeleteDocumentDialog(document: Document): void {
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
}
