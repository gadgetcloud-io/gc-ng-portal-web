import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, delay, tap } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface Device {
  id: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: string;
  purchasePrice?: number;
  warrantyExpires: string;
  warrantyProvider?: string;
  status: 'active' | 'expiring-soon' | 'expired';
  image?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceCreateRequest {
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: string;
  purchasePrice?: number;
  warrantyExpires: string;
  warrantyProvider?: string;
  notes?: string;
}

export interface DeviceUpdateRequest extends Partial<DeviceCreateRequest> {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private devices = new BehaviorSubject<Device[]>([]);
  public devices$ = this.devices.asObservable();

  // Flag to toggle between API and localStorage mode
  private useApi = true; // API mode enabled

  constructor(private apiService: ApiService) {
    // Load initial devices
    this.loadDevices();
  }

  /**
   * Get available categories from backend
   */
  getCategories(): Observable<Array<{value: string; label: string; emoji: string}>> {
    return this.apiService.get<Array<{value: string; label: string; emoji: string}>>('/items/categories').pipe(
      catchError(error => {
        console.error('Error fetching categories:', error);
        // Return default categories as fallback
        return of([
          { value: 'laptop', label: 'Laptop', emoji: '💻' },
          { value: 'phone', label: 'Smartphone', emoji: '📱' },
          { value: 'tablet', label: 'Tablet', emoji: '📱' },
          { value: 'watch', label: 'Smartwatch', emoji: '⌚' },
          { value: 'camera', label: 'Camera', emoji: '📷' },
          { value: 'other', label: 'Other', emoji: '📦' }
        ]);
      })
    );
  }

  /**
   * Load all devices
   */
  private loadDevices(): void {
    this.getDevices().subscribe({
      next: (devices) => this.devices.next(devices),
      error: (error) => console.error('Error loading devices:', error)
    });
  }

  /**
   * Get all devices
   */
  getDevices(): Observable<Device[]> {
    if (this.useApi) {
      // API mode: Call backend
      return this.apiService.get<any[]>('/items').pipe(
        map(backendDevices => {
          // Backend returns array directly, not wrapped in ApiResponse
          // Map backend field names to frontend field names
          return backendDevices.map(device => ({
            ...device,
            manufacturer: device.brand,  // brand → manufacturer
            warrantyExpires: device.warrantyExpiry  // warrantyExpiry → warrantyExpires
          }));
        }),
        tap((devices: Device[]) => {
          // Update the BehaviorSubject
          this.devices.next(devices);
        }),
        catchError(error => {
          console.error('Error fetching devices:', error);
          return of([]);
        })
      );
    } else {
      // localStorage mode: Mock API
      const stored = localStorage.getItem('gc_devices');
      const devices = stored ? JSON.parse(stored) : this.getMockDevices();

      // Save mock devices if none exist
      if (!stored) {
        localStorage.setItem('gc_devices', JSON.stringify(devices));
      }

      return of(devices).pipe(delay(500)); // Simulate API delay
    }
  }

  /**
   * Get device by ID
   */
  getDeviceById(id: string): Observable<Device | null> {
    if (this.useApi) {
      // API mode: Call backend
      return this.apiService.get<any>(`/items/${id}`).pipe(
        map(backendDevice => {
          if (!backendDevice) return null;
          // Map backend field names to frontend field names
          return {
            ...backendDevice,
            manufacturer: backendDevice.brand,  // brand → manufacturer
            warrantyExpires: backendDevice.warrantyExpiry  // warrantyExpiry → warrantyExpires
          };
        }),
        catchError(error => {
          console.error('Error fetching device:', error);
          return of(null);
        })
      );
    } else{
      // localStorage mode: Mock API
      const devices = this.getStoredDevices();
      const device = devices.find(d => d.id === id) || null;
      return of(device).pipe(delay(300));
    }
  }

  /**
   * Map frontend category to backend category
   * Backend now uses lowercase: phone, laptop, tablet, watch, camera, other
   */
  private mapCategoryToBackend(category: string): string {
    // If already lowercase (from backend), return as-is
    if (['phone', 'laptop', 'tablet', 'watch', 'camera', 'other'].includes(category.toLowerCase())) {
      return category.toLowerCase();
    }

    // Legacy mapping for old frontend categories (if any still exist)
    const categoryMap: { [key: string]: string } = {
      'Smartphone': 'phone',
      'Smartwatch': 'watch',
      'Headphones': 'other',
      'Speaker': 'other',
      'TV': 'other',
      'Monitor': 'other'
    };

    return categoryMap[category] || category.toLowerCase();
  }

  /**
   * Create new device
   */
  createDevice(device: DeviceCreateRequest): Observable<{ success: boolean; device?: Device; error?: string }> {
    if (this.useApi) {
      // API mode: Call backend
      // Map frontend field names to backend field names
      const backendDevice = {
        name: device.name,
        category: this.mapCategoryToBackend(device.category),  // Map category
        brand: device.manufacturer || 'Unknown',  // brand is required, default to 'Unknown'
        model: device.model || undefined,
        serialNumber: device.serialNumber || undefined,
        purchaseDate: device.purchaseDate,
        purchasePrice: device.purchasePrice || undefined,
        warrantyExpiry: device.warrantyExpires,  // warrantyExpires → warrantyExpiry
        warrantyProvider: device.warrantyProvider || undefined,
        notes: device.notes || undefined
      };

      return this.apiService.post<any>('/items', backendDevice).pipe(
        map(response => {
          console.log('Create device response:', response);
          // Backend returns device directly, not wrapped in ApiResponse
          if (response && response.id) {
            // Map backend fields to frontend fields
            const frontendDevice: Device = {
              ...response,
              manufacturer: response.brand,  // brand → manufacturer
              warrantyExpires: response.warrantyExpiry  // warrantyExpiry → warrantyExpires
            };

            // Update local state
            const currentDevices = this.devices.value;
            this.devices.next([...currentDevices, frontendDevice]);
            return { success: true, device: frontendDevice };
          }
          return { success: false, error: response.error || 'Failed to create device' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Failed to create device' });
        })
      );
    } else {
      // localStorage mode: Mock API
      return new Observable(observer => {
        setTimeout(() => {
          const devices = this.getStoredDevices();
          const newDevice: Device = {
            ...device,
            id: Date.now().toString(),
            status: this.calculateStatus(device.warrantyExpires),
            image: this.getDefaultImage(device.category),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          const updatedDevices = [...devices, newDevice];
          localStorage.setItem('gc_devices', JSON.stringify(updatedDevices));
          this.devices.next(updatedDevices);

          observer.next({ success: true, device: newDevice });
          observer.complete();
        }, 800);
      });
    }
  }

  /**
   * Update existing device
   */
  updateDevice(deviceUpdate: DeviceUpdateRequest): Observable<{ success: boolean; device?: Device; error?: string }> {
    if (this.useApi) {
      // API mode: Call backend
      return this.apiService.put<ApiResponse<Device>>(`/devices/${deviceUpdate.id}`, deviceUpdate).pipe(
        map(response => {
          if (response.success && response.data) {
            // Update local state
            const currentDevices = this.devices.value;
            const index = currentDevices.findIndex(d => d.id === deviceUpdate.id);
            if (index !== -1) {
              currentDevices[index] = response.data;
              this.devices.next([...currentDevices]);
            }
            return { success: true, device: response.data };
          }
          return { success: false, error: response.error || 'Failed to update device' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Failed to update device' });
        })
      );
    } else {
      // localStorage mode: Mock API
      return new Observable(observer => {
        setTimeout(() => {
          const devices = this.getStoredDevices();
          const index = devices.findIndex(d => d.id === deviceUpdate.id);

          if (index === -1) {
            observer.next({ success: false, error: 'Device not found' });
            observer.complete();
            return;
          }

          const updatedDevice: Device = {
            ...devices[index],
            ...deviceUpdate,
            status: deviceUpdate.warrantyExpires
              ? this.calculateStatus(deviceUpdate.warrantyExpires)
              : devices[index].status,
            updatedAt: new Date().toISOString()
          };

          devices[index] = updatedDevice;
          localStorage.setItem('gc_devices', JSON.stringify(devices));
          this.devices.next(devices);

          observer.next({ success: true, device: updatedDevice });
          observer.complete();
        }, 800);
      });
    }
  }

  /**
   * Delete device
   */
  deleteDevice(id: string): Observable<{ success: boolean; error?: string }> {
    if (this.useApi) {
      // API mode: Call backend
      return this.apiService.delete<ApiResponse<void>>(`/devices/${id}`).pipe(
        map(response => {
          if (response.success) {
            // Update local state
            const currentDevices = this.devices.value;
            this.devices.next(currentDevices.filter(d => d.id !== id));
            return { success: true };
          }
          return { success: false, error: response.error || 'Failed to delete device' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Failed to delete device' });
        })
      );
    } else {
      // localStorage mode: Mock API
      return new Observable(observer => {
        setTimeout(() => {
          const devices = this.getStoredDevices();
          const filteredDevices = devices.filter(d => d.id !== id);

          if (devices.length === filteredDevices.length) {
            observer.next({ success: false, error: 'Device not found' });
            observer.complete();
            return;
          }

          localStorage.setItem('gc_devices', JSON.stringify(filteredDevices));
          this.devices.next(filteredDevices);

          observer.next({ success: true });
          observer.complete();
        }, 600);
      });
    }
  }

  /**
   * Get devices from localStorage
   */
  private getStoredDevices(): Device[] {
    const stored = localStorage.getItem('gc_devices');
    if (!stored) return this.getMockDevices();
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored devices:', e);
      return this.getMockDevices();
    }
  }

  /**
   * Calculate device status based on warranty expiration
   */
  private calculateStatus(warrantyExpires: string): 'active' | 'expiring-soon' | 'expired' {
    const expiryDate = new Date(warrantyExpires);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return 'expired';
    } else if (daysUntilExpiry <= 90) {
      return 'expiring-soon';
    } else {
      return 'active';
    }
  }

  /**
   * Get default image emoji based on category
   */
  private getDefaultImage(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'laptop': '💻',
      'smartphone': '📱',
      'tablet': '📱',
      'headphones': '🎧',
      'smartwatch': '⌚',
      'camera': '📷',
      'speaker': '🔊',
      'tv': '📺',
      'monitor': '🖥️',
      'keyboard': '⌨️',
      'mouse': '🖱️',
      'printer': '🖨️',
      'router': '📡',
      'other': '📦'
    };
    return categoryMap[category.toLowerCase()] || '📦';
  }

  /**
   * Get mock devices for initial data
   */
  private getMockDevices(): Device[] {
    return [
      {
        id: '1',
        name: 'MacBook Pro 16"',
        category: 'Laptop',
        manufacturer: 'Apple',
        model: 'M3 Max',
        serialNumber: 'C02YX3ABMD6T',
        purchaseDate: '2024-01-15',
        purchasePrice: 3499,
        warrantyExpires: '2027-01-15',
        warrantyProvider: 'AppleCare+',
        status: 'active',
        image: '💻',
        notes: 'Primary work laptop',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'iPhone 15 Pro',
        category: 'Smartphone',
        manufacturer: 'Apple',
        model: 'iPhone 15 Pro',
        serialNumber: 'F17ZX9ABCD12',
        purchaseDate: '2023-09-22',
        purchasePrice: 999,
        warrantyExpires: '2025-03-15',
        warrantyProvider: 'AppleCare+',
        status: 'expiring-soon',
        image: '📱',
        notes: 'Personal phone',
        createdAt: '2023-09-22T14:30:00Z',
        updatedAt: '2023-09-22T14:30:00Z'
      },
      {
        id: '3',
        name: 'Sony WH-1000XM5',
        category: 'Headphones',
        manufacturer: 'Sony',
        model: 'WH-1000XM5',
        serialNumber: 'SN12345678',
        purchaseDate: '2023-05-10',
        purchasePrice: 399,
        warrantyExpires: '2024-05-10',
        warrantyProvider: 'Sony',
        status: 'expired',
        image: '🎧',
        notes: 'Noise-canceling headphones',
        createdAt: '2023-05-10T09:15:00Z',
        updatedAt: '2023-05-10T09:15:00Z'
      },
      {
        id: '4',
        name: 'iPad Pro 12.9"',
        category: 'Tablet',
        manufacturer: 'Apple',
        model: 'iPad Pro M2',
        serialNumber: 'DMTX54ABPQ7',
        purchaseDate: '2024-03-20',
        purchasePrice: 1099,
        warrantyExpires: '2026-03-20',
        warrantyProvider: 'AppleCare+',
        status: 'active',
        image: '📱',
        notes: 'Drawing and note-taking',
        createdAt: '2024-03-20T16:45:00Z',
        updatedAt: '2024-03-20T16:45:00Z'
      }
    ];
  }

  /**
   * Get device statistics
   */
  getStats(): Observable<{
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
  }> {
    return this.devices$.pipe(
      map(devices => ({
        total: devices.length,
        active: devices.filter(d => d.status === 'active').length,
        expiringSoon: devices.filter(d => d.status === 'expiring-soon').length,
        expired: devices.filter(d => d.status === 'expired').length
      }))
    );
  }
}
