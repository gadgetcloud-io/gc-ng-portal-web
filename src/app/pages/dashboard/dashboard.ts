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
import { DocumentService, GenericDocument } from '../../core/services/document.service';
import { DeviceStatsComponent, DeviceStat, StatClickEvent } from '../../shared/components/device-stats/device-stats';
import { AnalyticsClickEvent } from '../../shared/components/analytics-dashboard/analytics-dashboard';
import { DeviceListComponent } from '../../shared/components/device-list/device-list';
import { ActivityService, Activity } from '../../core/services/activity.service';
import { CardComponent } from '../../shared/components/card/card';
import { BadgeComponent } from '../../shared/components/badge/badge';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { AnalyticsDashboardComponent } from '../../shared/components/analytics-dashboard/analytics-dashboard';
import { FeatureFlagsService, FeatureFlag } from '../../core/services/feature-flags.service';

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
    DeviceListComponent,
    CardComponent,
    BadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
    AnalyticsDashboardComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user: User | null = null;
  devices: Device[] = [];
  isLoading = true;
  isLoadingActivity = true;

  // Feature flags
  showAnalytics = false;

  // Dialog states
  isAddDialogOpen = false;
  isEditDialogOpen = false;
  isDeleteDialogOpen = false;
  selectedDevice: Device | null = null;

  // Document dialog states
  isUploadDocumentDialogOpen = false;
  isViewDocumentsDialogOpen = false;
  isDeleteDocumentDialogOpen = false;
  selectedDocument: GenericDocument | null = null;
  selectedDeviceForDocs: Device | null = null;

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private deviceService: DeviceService,
    private documentService: DocumentService,
    private activityService: ActivityService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private featureFlags: FeatureFlagsService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    // Check if analytics dashboard should be shown
    this.showAnalytics = this.featureFlags.isEnabled(FeatureFlag.ANALYTICS_DASHBOARD);

    if (!this.user) {
      // Redirect to home if not authenticated
      this.router.navigate(['/']);
      return;
    }

    // Load devices and activity in parallel
    this.loadDevicesData();
    this.loadRecentActivity();
  }

  private loadDevicesData(): void {
    // Subscribe to devices observable
    const devicesSub = this.deviceService.devices$.subscribe({
      next: (devices) => {
        this.devices = devices;
        this.isLoading = false;
        this.updateStats();
        this.cdr.detectChanges(); // Explicitly trigger change detection
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
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
      color: 'blue',
      filterKey: 'status',
      filterValue: 'all'
    },
    {
      label: 'Active Warranties',
      value: '0',
      change: '0% coverage',
      trend: 'neutral',
      icon: '🛡️',
      color: 'green',
      filterKey: 'status',
      filterValue: 'active'
    },
    {
      label: 'Expiring Soon',
      value: '0',
      change: 'Next 90 days',
      trend: 'neutral',
      icon: '⚠️',
      color: 'yellow',
      filterKey: 'status',
      filterValue: 'expiring-soon'
    },
    {
      label: 'Expired',
      value: '0',
      change: 'No coverage',
      trend: 'neutral',
      icon: '❌',
      color: 'red',
      filterKey: 'status',
      filterValue: 'expired'
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

    // Update reminders based on real devices
    this.updateUpcomingReminders();
  }

  recentActivity: Activity[] = [];

  // Warranty coverage percentages
  coverageData = {
    active: { count: 0, percentage: 0 },
    expiringSoon: { count: 0, percentage: 0 },
    expired: { count: 0, percentage: 0 }
  };

  /**
   * Load recent activity from audit logs (live data)
   */
  private loadRecentActivity(): void {
    this.isLoadingActivity = true;

    const activitySub = this.activityService.getRecentActivity(10).subscribe({
      next: (activities) => {
        this.recentActivity = activities;
        this.isLoadingActivity = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading recent activity:', error);
        this.isLoadingActivity = false;
        // Keep empty array as fallback
        this.recentActivity = [];
        this.cdr.detectChanges();
      }
    });

    this.subscriptions.add(activitySub);
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
    // Navigate to device detail page instead of opening edit dialog
    this.router.navigate(['/my-gadgets', deviceId]);
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
    this.cdr.detectChanges();
  }

  onDeviceUpdated(): void {
    // Device was updated successfully, dialog will close automatically
    console.log('Device updated successfully');
    this.cdr.detectChanges();
  }

  onDeviceDeleted(): void {
    // Device was deleted successfully, dialog will close automatically
    console.log('Device deleted successfully');
    this.cdr.detectChanges();
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
    // Optionally reload the view documents dialog if it's open
    if (this.isViewDocumentsDialogOpen && this.selectedDeviceForDocs) {
      // The ViewDocumentsDialog will auto-reload when reopened
    }
  }

  onDocumentDeleted(): void {
    console.log('Document deleted successfully');
    this.cdr.detectChanges();
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

  /**
   * Handle stat card clicks from DeviceStatsComponent
   */
  onStatClick(event: StatClickEvent): void {
    if (event.filterKey && event.filterValue) {
      this.navigateToDevicesWithFilter(event.filterKey, event.filterValue);
    } else {
      // Navigate to devices page without filters for "Total Devices"
      this.router.navigate(['/my-gadgets']);
    }
  }

  /**
   * Handle analytics card clicks from AnalyticsDashboardComponent
   */
  onAnalyticsCardClick(event: AnalyticsClickEvent): void {
    if (event.filterKey && event.filterValue) {
      this.navigateToDevicesWithFilter(event.filterKey, event.filterValue);
    } else if (event.type === 'summary') {
      // For summary cards without specific filters, navigate to devices page
      this.router.navigate(['/my-gadgets']);
    }
  }

  /**
   * Navigate to devices page with a filter applied
   */
  private navigateToDevicesWithFilter(filterKey: string, filterValue: string): void {
    this.router.navigate(['/my-gadgets'], {
      queryParams: { [filterKey]: filterValue }
    });
  }
}
