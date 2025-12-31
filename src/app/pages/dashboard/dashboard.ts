import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { DeviceStatsComponent, DeviceStat } from '../../shared/components/device-stats/device-stats';
import { DeviceListComponent } from '../../shared/components/device-list/device-list';

interface Activity {
  id: string;
  type: 'device-added' | 'document-uploaded' | 'warranty-renewed' | 'service-scheduled';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    AddDeviceDialogComponent,
    EditDeviceDialogComponent,
    DeleteDeviceDialogComponent,
    UploadDocumentDialogComponent,
    ViewDocumentsDialogComponent,
    DeleteDocumentDialogComponent,
    DeviceStatsComponent,
    DeviceListComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  devices: Device[] = [];
  isLoading = true;

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

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private documentService: DocumentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      // Redirect to home if not authenticated
      this.router.navigate(['/']);
      return;
    }

    // Subscribe to devices
    const devicesSub = this.deviceService.devices$.subscribe({
      next: (devices) => {
        this.devices = devices;
        this.isLoading = false;
        this.updateStats();
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.isLoading = false;
      }
    });

    this.subscriptions.add(devicesSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  stats: DeviceStat[] = [
    {
      label: 'Total Devices',
      value: '0',
      change: '+0 this month',
      trend: 'neutral',
      icon: '📱',
      color: 'blue'
    },
    {
      label: 'Active Warranties',
      value: '0',
      change: '0% coverage',
      trend: 'neutral',
      icon: '🛡️',
      color: 'green'
    },
    {
      label: 'Expiring Soon',
      value: '0',
      change: 'Next 90 days',
      trend: 'neutral',
      icon: '⚠️',
      color: 'yellow'
    },
    {
      label: 'Expired',
      value: '0',
      change: 'No coverage',
      trend: 'neutral',
      icon: '❌',
      color: 'red'
    }
  ];

  private updateStats(): void {
    const total = this.devices.length;
    const active = this.devices.filter(d => d.status === 'active').length;
    const expiringSoon = this.devices.filter(d => d.status === 'expiring-soon').length;
    const expired = this.devices.filter(d => d.status === 'expired').length;
    const coverage = total > 0 ? Math.round((active / total) * 100) : 0;

    this.stats[0].value = total.toString();
    this.stats[0].change = `${this.devices.length} registered`;
    this.stats[0].trend = total > 0 ? 'up' : 'neutral';

    this.stats[1].value = active.toString();
    this.stats[1].change = `${coverage}% coverage`;
    this.stats[1].trend = coverage >= 75 ? 'up' : coverage >= 50 ? 'neutral' : 'down';

    this.stats[2].value = expiringSoon.toString();
    this.stats[2].change = 'Next 90 days';
    this.stats[2].trend = expiringSoon > 0 ? 'down' : 'neutral';

    this.stats[3].value = expired.toString();
    this.stats[3].change = expired > 0 ? 'Needs renewal' : 'All covered';
    this.stats[3].trend = expired > 0 ? 'down' : 'up';
  }


  recentActivity: Activity[] = [
    {
      id: '1',
      type: 'device-added',
      title: 'New device added',
      description: 'MacBook Pro 16" added to inventory',
      timestamp: '2 hours ago',
      icon: '➕'
    },
    {
      id: '2',
      type: 'document-uploaded',
      title: 'Document uploaded',
      description: 'Receipt uploaded for iPhone 15 Pro',
      timestamp: '5 hours ago',
      icon: '📄'
    },
    {
      id: '3',
      type: 'warranty-renewed',
      title: 'Warranty renewed',
      description: 'AppleCare+ extended for iPad Pro',
      timestamp: '1 day ago',
      icon: '🔄'
    },
    {
      id: '4',
      type: 'service-scheduled',
      title: 'Service scheduled',
      description: 'Battery replacement for MacBook Air',
      timestamp: '2 days ago',
      icon: '🔧'
    }
  ];

  quickActions = [
    {
      label: 'Add Device',
      icon: '➕',
      action: 'add-device',
      color: 'blue'
    },
    {
      label: 'Upload Document',
      icon: '📤',
      action: 'upload-document',
      color: 'green'
    },
    {
      label: 'Renew Warranty',
      icon: '🔄',
      action: 'renew-warranty',
      color: 'purple'
    },
    {
      label: 'View Reports',
      icon: '📊',
      action: 'view-reports',
      color: 'orange'
    }
  ];

  upcomingReminders = [
    {
      id: '1',
      title: 'iPhone 15 Pro warranty expiring',
      date: '2025-03-15',
      daysLeft: 75,
      type: 'warranty',
      priority: 'high'
    },
    {
      id: '2',
      title: 'MacBook Air service due',
      date: '2025-02-10',
      daysLeft: 42,
      type: 'service',
      priority: 'medium'
    },
    {
      id: '3',
      title: 'AppleCare+ renewal available',
      date: '2025-04-01',
      daysLeft: 92,
      type: 'renewal',
      priority: 'low'
    }
  ];


  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }

  onQuickAction(action: string): void {
    switch (action) {
      case 'add-device':
        this.openAddDialog();
        break;
      case 'upload-document':
        this.openUploadDocumentDialog();
        break;
      case 'renew-warranty':
      case 'view-reports':
        alert(`${action} functionality will be implemented.`);
        break;
    }
  }

  onViewDevice(deviceId: string): void {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      this.openEditDialog(device);
    }
  }

  // Dialog methods
  openAddDialog(): void {
    this.isAddDialogOpen = true;
  }

  openEditDialog(device: Device): void {
    this.selectedDevice = device;
    this.isEditDialogOpen = true;
  }

  onDeleteDevice(device: Device): void {
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
    // Device was added successfully, dialog will close automatically
    console.log('Device added successfully');
  }

  onDeviceUpdated(): void {
    // Device was updated successfully, dialog will close automatically
    console.log('Device updated successfully');
  }

  onDeviceDeleted(): void {
    // Device was deleted successfully, dialog will close automatically
    console.log('Device deleted successfully');
  }

  // Document dialog methods
  openUploadDocumentDialog(deviceId?: string): void {
    if (deviceId) {
      this.selectedDeviceForDocs = this.devices.find(d => d.id === deviceId) || null;
    } else {
      this.selectedDeviceForDocs = null;
    }
    this.isUploadDocumentDialogOpen = true;
  }

  openViewDocumentsDialog(device: Device): void {
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
    // Optionally reload the view documents dialog if it's open
    if (this.isViewDocumentsDialogOpen && this.selectedDeviceForDocs) {
      // The ViewDocumentsDialog will auto-reload when reopened
    }
  }

  onDocumentDeleted(): void {
    console.log('Document deleted successfully');
    // The ViewDocumentsDialog will auto-update via the observable
  }

  onUploadNewFromViewDialog(): void {
    // Called when user clicks "Upload New" from the view documents dialog
    const deviceId = this.selectedDeviceForDocs?.id;
    this.closeViewDocumentsDialog();
    if (deviceId) {
      this.openUploadDocumentDialog(deviceId);
    }
  }
}
