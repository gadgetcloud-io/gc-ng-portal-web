import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';

interface Device {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  warrantyExpires: string;
  status: 'active' | 'expiring-soon' | 'expired';
  image: string;
}

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
  imports: [CommonModule, RouterLink, ButtonComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  stats = [
    {
      label: 'Total Devices',
      value: '24',
      change: '+3 this month',
      trend: 'up' as const,
      icon: '📱',
      color: 'blue'
    },
    {
      label: 'Active Warranties',
      value: '18',
      change: '75% coverage',
      trend: 'neutral' as const,
      icon: '🛡️',
      color: 'green'
    },
    {
      label: 'Expiring Soon',
      value: '3',
      change: 'Next 30 days',
      trend: 'down' as const,
      icon: '⚠️',
      color: 'yellow'
    },
    {
      label: 'Documents',
      value: '47',
      change: '+5 this week',
      trend: 'up' as const,
      icon: '📄',
      color: 'purple'
    }
  ];

  recentDevices: Device[] = [
    {
      id: '1',
      name: 'MacBook Pro 16"',
      category: 'Laptop',
      purchaseDate: '2024-01-15',
      warrantyExpires: '2027-01-15',
      status: 'active',
      image: '💻'
    },
    {
      id: '2',
      name: 'iPhone 15 Pro',
      category: 'Smartphone',
      purchaseDate: '2023-09-22',
      warrantyExpires: '2025-03-15',
      status: 'expiring-soon',
      image: '📱'
    },
    {
      id: '3',
      name: 'Sony WH-1000XM5',
      category: 'Headphones',
      purchaseDate: '2023-05-10',
      warrantyExpires: '2024-05-10',
      status: 'expired',
      image: '🎧'
    },
    {
      id: '4',
      name: 'iPad Pro 12.9"',
      category: 'Tablet',
      purchaseDate: '2024-03-20',
      warrantyExpires: '2026-03-20',
      status: 'active',
      image: '📱'
    }
  ];

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

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'expiring-soon':
        return 'status-warning';
      case 'expired':
        return 'status-danger';
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
    console.log('Quick action:', action);
    alert(`${action} functionality will be implemented.`);
  }

  onViewDevice(deviceId: string): void {
    console.log('View device:', deviceId);
    alert('Device details view will be implemented.');
  }
}
