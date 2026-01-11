import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DeviceStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  /** Optional filter key to apply when clicked */
  filterKey?: string;
  /** Optional filter value to apply when clicked */
  filterValue?: string;
}

export interface StatClickEvent {
  stat: DeviceStat;
  filterKey?: string;
  filterValue?: string;
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
  @Input() clickable = true;
  @Output() statClick = new EventEmitter<StatClickEvent>();

  onStatClick(stat: DeviceStat): void {
    if (this.clickable) {
      this.statClick.emit({
        stat,
        filterKey: stat.filterKey,
        filterValue: stat.filterValue
      });
    }
  }
}
