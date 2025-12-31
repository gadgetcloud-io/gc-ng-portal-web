import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DeviceStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
}

@Component({
  selector: 'gc-device-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './device-stats.html',
  styleUrl: './device-stats.scss'
})
export class DeviceStatsComponent {
  @Input() stats: DeviceStat[] = [];
}
