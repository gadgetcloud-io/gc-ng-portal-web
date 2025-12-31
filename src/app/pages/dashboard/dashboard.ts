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

    // Load devices first
    this.loadDevicesData();
  }

  private loadDevicesData(): void {
    // Subscribe to devices observable
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

    // Explicitly trigger a devices reload to ensure fresh data
    this.deviceService.getDevices().subscribe({
      next: () => {
        // Data will be updated via the devices$ subscription above
      },
      error: (error) => {
        console.error('Error fetching devices:', error);
        this.isLoading = false;
      }
    });
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

    // Update coverage data for the chart
    this.coverageData = {
      active: {
        count: active,
        percentage: total > 0 ? Math.round((active / total) * 100) : 0
      },
      expiringSoon: {
        count: expiringSoon,
        percentage: total > 0 ? Math.round((expiringSoon / total) * 100) : 0
      },
      expired: {
        count: expired,
        percentage: total > 0 ? Math.round((expired / total) * 100) : 0
      }
    };

    // Update recent activity and reminders based on real devices
    this.updateRecentActivity();
    this.updateUpcomingReminders();
  }

  recentActivity: Activity[] = [];

  // Warranty coverage percentages
  coverageData = {
    active: { count: 0, percentage: 0 },
    expiringSoon: { count: 0, percentage: 0 },
    expired: { count: 0, percentage: 0 }
  };

  private updateRecentActivity(): void {
    this.recentActivity = [];

    // Generate activity from devices (sorted by creation date, most recent first)
    const sortedDevices = [...this.devices].sort((a, b) => {
      const dateA = new Date(a.purchaseDate || 0).getTime();
      const dateB = new Date(b.purchaseDate || 0).getTime();
      return dateB - dateA;
    });

    // Add device additions to activity (limit to 5 most recent)
    sortedDevices.slice(0, 5).forEach((device, index) => {
      const purchaseDate = new Date(device.purchaseDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let timestamp = '';
      if (diffDays === 0) {
        timestamp = 'Today';
      } else if (diffDays === 1) {
        timestamp = 'Yesterday';
      } else if (diffDays < 7) {
        timestamp = `${diffDays} days ago`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        timestamp = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else {
        const months = Math.floor(diffDays / 30);
        timestamp = `${months} month${months > 1 ? 's' : ''} ago`;
      }

      this.recentActivity.push({
        id: `device-${device.id}`,
        type: 'device-added',
        title: 'Device registered',
        description: `${device.name} added to inventory`,
        timestamp,
        icon: '📱'
      });
    });

    // Add warranty expiration warnings for devices expiring soon
    const expiringDevices = this.devices.filter(d => d.status === 'expiring-soon');
    expiringDevices.slice(0, 3).forEach(device => {
      const expiryDate = new Date(device.warrantyExpires);
      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      this.recentActivity.push({
        id: `warranty-${device.id}`,
        type: 'warranty-renewed',
        title: 'Warranty expiring soon',
        description: `${device.name} warranty expires in ${diffDays} days`,
        timestamp: `${diffDays} days remaining`,
        icon: '⚠️'
      });
    });

    // Sort all activities by most recent (based on timestamp text for now)
    // In a real implementation, you'd store actual timestamps
    this.recentActivity = this.recentActivity.slice(0, 8);
  }

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

  upcomingReminders: Array<{
    id: string;
    title: string;
    date: string;
    daysLeft: number;
    type: string;
    priority: string;
  }> = [];

  private updateUpcomingReminders(): void {
    this.upcomingReminders = [];

    // Generate reminders for devices with warranties expiring in the next 120 days
    const now = new Date();

    this.devices.forEach(device => {
      const expiryDate = new Date(device.warrantyExpires);
      const diffTime = expiryDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Only show reminders for warranties expiring in the next 120 days
      if (daysLeft > 0 && daysLeft <= 120) {
        let priority = 'low';
        if (daysLeft <= 30) {
          priority = 'high';
        } else if (daysLeft <= 60) {
          priority = 'medium';
        }

        this.upcomingReminders.push({
          id: device.id,
          title: `${device.name} warranty expiring`,
          date: device.warrantyExpires,
          daysLeft,
          type: 'warranty',
          priority
        });
      }
    });

    // Sort by days left (most urgent first)
    this.upcomingReminders.sort((a, b) => a.daysLeft - b.daysLeft);

    // Limit to top 5 reminders
    this.upcomingReminders = this.upcomingReminders.slice(0, 5);
  }


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
