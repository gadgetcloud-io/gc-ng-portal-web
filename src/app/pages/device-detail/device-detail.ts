import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DeviceService, Device } from '../../core/services/device.service';

@Component({
  selector: 'gc-device-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './device-detail.html',
  styleUrls: ['./device-detail.scss']
})
export class DeviceDetailComponent implements OnInit {
  deviceId: string = '';
  device: Device | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deviceService: DeviceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get device ID from route params
    this.deviceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.deviceId) {
      this.loadDevice();
    } else {
      this.error = 'No device ID provided';
      this.loading = false;
    }
  }

  /**
   * Load device details
   */
  private loadDevice(): void {
    this.loading = true;
    this.error = null;

    this.deviceService.getDeviceById(this.deviceId).subscribe({
      next: (device) => {
        if (device) {
          this.device = device;
        } else {
          this.error = 'Device not found';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading device:', err);
        this.error = 'Failed to load device details';
        this.loading = false;
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
   * Format currency
   */
  formatCurrency(value: number | undefined): string {
    if (!value) return 'N/A';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
}
