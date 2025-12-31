import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device } from '../../../core/services/device.service';
import { DeviceCardComponent } from '../device-card/device-card';
import { ButtonComponent } from '../button/button';

@Component({
  selector: 'gc-device-list',
  standalone: true,
  imports: [CommonModule, DeviceCardComponent, ButtonComponent],
  templateUrl: './device-list.html',
  styleUrl: './device-list.scss'
})
export class DeviceListComponent {
  @Input() devices: Device[] = [];
  @Input() isLoading = false;
  @Input() showHeader = true;
  @Input() showAddButton = true;
  @Input() maxDevices?: number;

  @Output() addDevice = new EventEmitter<void>();
  @Output() viewDevice = new EventEmitter<string>();
  @Output() editDevice = new EventEmitter<Device>();
  @Output() deleteDevice = new EventEmitter<Device>();
  @Output() viewDocuments = new EventEmitter<Device>();

  get displayedDevices(): Device[] {
    if (this.maxDevices) {
      return this.devices.slice(0, this.maxDevices);
    }
    return this.devices;
  }

  onAddDevice(): void {
    this.addDevice.emit();
  }

  onViewDevice(deviceId: string): void {
    this.viewDevice.emit(deviceId);
  }

  onEditDevice(device: Device): void {
    this.editDevice.emit(device);
  }

  onDeleteDevice(device: Device): void {
    this.deleteDevice.emit(device);
  }

  onViewDocuments(device: Device): void {
    this.viewDocuments.emit(device);
  }
}
