import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoginDialogComponent } from '../../shared/components/login-dialog/login-dialog';
import { SignupDialogComponent } from '../../shared/components/signup-dialog/signup-dialog';
import { AddDeviceDialogComponent } from '../../shared/components/device-dialogs/add-device-dialog';
import { DeviceService, Device } from '../../core/services/device.service';
import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LoginDialogComponent, SignupDialogComponent, AddDeviceDialogComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  // Data
  devices: Device[] = [];
  isLoading = false;

  // Dialogs
  isLoginDialogOpen = false;
  isSignupDialogOpen = false;
  isAddDeviceDialogOpen = false;

  constructor(
    private deviceService: DeviceService,
    public documentService: DocumentService,
    public authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  loadDevices(): void {
    this.isLoading = true;
    this.deviceService.devices$.subscribe({
      next: (devices) => {
        this.devices = devices.slice(0, 5); // Show only 5 recent devices
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading devices:', error);
        this.isLoading = false;
      }
    });
  }

  // Add device dialog
  openAddDeviceDialog(): void {
    if (!this.authService.isAuthenticated()) {
      this.isLoginDialogOpen = true;
      return;
    }
    this.isAddDeviceDialogOpen = true;
  }

  closeAddDeviceDialog(): void {
    this.isAddDeviceDialogOpen = false;
  }

  onDeviceAdded(): void {
    this.closeAddDeviceDialog();
    this.loadDevices();
  }

  // Device actions
  viewDevice(device: Device): void {
    this.router.navigate(['/dashboard'], {
      queryParams: { deviceId: device.id }
    });
  }

  editDevice(device: Device): void {
    this.router.navigate(['/dashboard'], {
      queryParams: { deviceId: device.id, mode: 'edit' }
    });
  }

  deleteDevice(device: Device): void {
    if (confirm(`Are you sure you want to delete "${device.name}"?`)) {
      this.deviceService.deleteDevice(device.id).subscribe({
        next: (result) => {
          if (result.success) {
            this.loadDevices();
          } else {
            alert('Failed to delete device: ' + (result.error || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error deleting device:', error);
          alert('Failed to delete device');
        }
      });
    }
  }

  viewDocuments(device: Device): void {
    this.router.navigate(['/dashboard'], {
      queryParams: { deviceId: device.id, view: 'documents' }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
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

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Active';
      case 'expiring-soon':
        return 'Expiring Soon';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Auth dialog handlers
  onLoginSuccess(): void {
    this.ngZone.run(() => {
      this.isLoginDialogOpen = false;
      // Open add device dialog after successful login
      this.isAddDeviceDialogOpen = true;
    });
  }

  onSignupSuccess(): void {
    this.ngZone.run(() => {
      this.isSignupDialogOpen = false;
      // Open add device dialog after successful signup
      this.isAddDeviceDialogOpen = true;
    });
  }

  closeLoginDialog(): void {
    this.isLoginDialogOpen = false;
  }

  closeSignupDialog(): void {
    this.isSignupDialogOpen = false;
  }

  switchToSignup(): void {
    this.isLoginDialogOpen = false;
    this.isSignupDialogOpen = true;
  }

  switchToLogin(): void {
    this.isSignupDialogOpen = false;
    this.isLoginDialogOpen = true;
  }
}
