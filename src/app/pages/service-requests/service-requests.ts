import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService, User } from '../../core/services/auth.service';

export interface ServiceRequest {
  id: string;
  deviceName: string;
  requestType: 'repair' | 'maintenance' | 'warranty-claim' | 'support';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './service-requests.html',
  styleUrl: './service-requests.scss'
})
export class ServiceRequestsComponent implements OnInit {
  user: User | null = null;
  serviceRequests: ServiceRequest[] = [];
  filteredRequests: ServiceRequest[] = [];
  isLoading = false;
  selectedStatus = 'all';
  selectedType = 'all';

  statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  types = [
    { value: 'all', label: 'All Types' },
    { value: 'repair', label: 'Repair' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'warranty-claim', label: 'Warranty Claim' },
    { value: 'support', label: 'Support' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/']);
      return;
    }

    this.loadServiceRequests();
  }

  private loadServiceRequests(): void {
    // TODO: Replace with actual API call to backend
    // For now, using mock data
    this.isLoading = true;

    setTimeout(() => {
      this.serviceRequests = [
        {
          id: 'SR-001',
          deviceName: 'iPhone 13 Pro',
          requestType: 'repair',
          status: 'in-progress',
          priority: 'high',
          subject: 'Screen replacement needed',
          description: 'Cracked screen after accidental drop',
          createdAt: '2025-12-20T10:00:00Z',
          updatedAt: '2025-12-28T15:30:00Z',
          assignedTo: 'Tech Support Team'
        },
        {
          id: 'SR-002',
          deviceName: 'MacBook Pro 16"',
          requestType: 'maintenance',
          status: 'completed',
          priority: 'medium',
          subject: 'Battery health check',
          description: 'Regular battery health inspection',
          createdAt: '2025-12-15T14:00:00Z',
          updatedAt: '2025-12-22T11:00:00Z',
          assignedTo: 'Maintenance Team'
        },
        {
          id: 'SR-003',
          deviceName: 'AirPods Pro',
          requestType: 'warranty-claim',
          status: 'pending',
          priority: 'low',
          subject: 'Left earbud not working',
          description: 'Left earbud stopped working within warranty period',
          createdAt: '2025-12-28T09:00:00Z',
          updatedAt: '2025-12-28T09:00:00Z'
        }
      ];

      this.applyFilters();
      this.isLoading = false;
    }, 500);
  }

  applyFilters(): void {
    this.filteredRequests = this.serviceRequests.filter(request => {
      const matchesStatus = this.selectedStatus === 'all' || request.status === this.selectedStatus;
      const matchesType = this.selectedType === 'all' || request.requestType === this.selectedType;
      return matchesStatus && matchesType;
    });
  }

  onStatusChange(event: Event): void {
    this.selectedStatus = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  onTypeChange(event: Event): void {
    this.selectedType = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'in-progress':
        return 'status-progress';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
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

  getPriorityLabel(priority: string): string {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'repair':
        return '🔧';
      case 'maintenance':
        return '🛠️';
      case 'warranty-claim':
        return '🛡️';
      case 'support':
        return '💬';
      default:
        return '📋';
    }
  }

  getTypeLabel(type: string): string {
    switch (type) {
      case 'repair':
        return 'Repair';
      case 'maintenance':
        return 'Maintenance';
      case 'warranty-claim':
        return 'Warranty Claim';
      case 'support':
        return 'Support';
      default:
        return type;
    }
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openNewRequestDialog(): void {
    // TODO: Implement new service request dialog
    alert('New service request dialog will be implemented. This will allow users to create new service tickets.');
  }

  viewRequestDetails(request: ServiceRequest): void {
    // TODO: Implement request details view
    alert(`View details for ${request.id}: ${request.subject}`);
  }
}
