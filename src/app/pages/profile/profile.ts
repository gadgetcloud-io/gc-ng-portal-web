import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService, User } from '../../core/services/auth.service';
import { DeviceService, Device } from '../../core/services/device.service';
import { DeviceListComponent } from '../../shared/components/device-list/device-list';
import { DeviceStatsComponent, DeviceStat } from '../../shared/components/device-stats/device-stats';
import { AddDeviceDialogComponent } from '../../shared/components/device-dialogs/add-device-dialog';
import { EditDeviceDialogComponent } from '../../shared/components/device-dialogs/edit-device-dialog';
import { DeleteDeviceDialogComponent } from '../../shared/components/device-dialogs/delete-device-dialog';
import { ViewDocumentsDialogComponent } from '../../shared/components/document-dialogs/view-documents-dialog';
import { DocumentService, Document } from '../../core/services/document.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    DeviceListComponent,
    DeviceStatsComponent,
    AddDeviceDialogComponent,
    EditDeviceDialogComponent,
    DeleteDeviceDialogComponent,
    ViewDocumentsDialogComponent
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  devices: Device[] = [];
  isLoadingDevices = true;
  stats: DeviceStat[] = [];

  // Dialog states
  isAddDialogOpen = false;
  isEditDialogOpen = false;
  isDeleteDialogOpen = false;
  isViewDocumentsDialogOpen = false;
  selectedDevice: Device | null = null;
  selectedDeviceForDocs: Device | null = null;

  private subscriptions = new Subscription();

  userInfo = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '+1 (555) 123-4567',
    role: 'Free User',
    avatar: '',
    joinDate: 'January 2025',
    devicesCount: 0
  };

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

    // Parse name into first and last name
    const nameParts = this.user.name.split(' ');
    this.userInfo.firstName = nameParts[0] || '';
    this.userInfo.lastName = nameParts.slice(1).join(' ') || '';
    this.userInfo.email = this.user.email;
    this.userInfo.avatar = this.user.name.charAt(0).toUpperCase();

    // Load devices
    this.loadDevicesData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private loadDevicesData(): void {
    // Subscribe to devices observable
    const devicesSub = this.deviceService.devices$.subscribe({
      next: (devices) => {
        this.devices = devices;
        this.userInfo.devicesCount = devices.length;
        this.isLoadingDevices = false;
        this.updateStats();
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.isLoadingDevices = false;
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
        this.isLoadingDevices = false;
      }
    });
  }

  private updateStats(): void {
    const total = this.devices.length;
    const active = this.devices.filter(d => d.status === 'active').length;
    const expiringSoon = this.devices.filter(d => d.status === 'expiring-soon').length;
    const expired = this.devices.filter(d => d.status === 'expired').length;
    const coverage = total > 0 ? Math.round((active / total) * 100) : 0;

    this.stats = [
      {
        label: 'Total Devices',
        value: total.toString(),
        change: `${total} registered`,
        trend: total > 0 ? 'up' : 'neutral',
        icon: '📱',
        color: 'blue'
      },
      {
        label: 'Active Warranties',
        value: active.toString(),
        change: `${coverage}% coverage`,
        trend: coverage >= 75 ? 'up' : coverage >= 50 ? 'neutral' : 'down',
        icon: '🛡️',
        color: 'green'
      },
      {
        label: 'Expiring Soon',
        value: expiringSoon.toString(),
        change: 'Next 90 days',
        trend: expiringSoon > 0 ? 'down' : 'neutral',
        icon: '⚠️',
        color: 'yellow'
      },
      {
        label: 'Expired',
        value: expired.toString(),
        change: expired > 0 ? 'Needs renewal' : 'All covered',
        trend: expired > 0 ? 'down' : 'up',
        icon: '❌',
        color: 'red'
      }
    ];
  }

  updateProfile(): void {
    console.log('Update profile clicked');
  }

  changePassword(): void {
    console.log('Change password clicked');
  }

  toggleTwoFactor(): void {
    console.log('Toggle 2FA clicked');
  }

  // Device dialog methods
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

  openViewDocumentsDialog(device: Device): void {
    this.selectedDeviceForDocs = device;
    this.isViewDocumentsDialogOpen = true;
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

  closeViewDocumentsDialog(): void {
    this.isViewDocumentsDialogOpen = false;
    this.selectedDeviceForDocs = null;
  }

  onViewDevice(deviceId: string): void {
    const device = this.devices.find(d => d.id === deviceId);
    if (device) {
      this.openEditDialog(device);
    }
  }

  onDeviceAdded(): void {
    console.log('Device added successfully');
  }

  onDeviceUpdated(): void {
    console.log('Device updated successfully');
  }

  onDeviceDeleted(): void {
    console.log('Device deleted successfully');
  }
}
