import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService, User } from '../../core/services/auth.service';
import { ServiceTicketService } from '../../core/services/service-ticket.service';
import { ServiceTicket } from '../../core/models/service-ticket.model';
import { TicketDetailModalComponent } from '../device-detail/tabs/service-tickets-tab/ticket-detail-modal.component';

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [CommonModule, ButtonComponent, TicketDetailModalComponent],
  templateUrl: './service-requests.html',
  styleUrl: './service-requests.scss'
})
export class ServiceRequestsComponent implements OnInit, OnDestroy {
  user: User | null = null;
  serviceRequests: ServiceTicket[] = [];
  filteredRequests: ServiceTicket[] = [];
  isLoading = false;
  selectedStatus = 'all';
  selectedType = 'all';
  highlightedTicketId: string | null = null;

  // Modal state
  isDetailModalOpen = false;
  selectedTicket: ServiceTicket | null = null;

  private destroy$ = new Subject<void>();

  statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending_customer', label: 'Pending Customer' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  types = [
    { value: 'all', label: 'All Types' },
    { value: 'repair', label: 'Repair' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'warranty_claim', label: 'Warranty Claim' },
    { value: 'replacement', label: 'Replacement' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private serviceTicketService: ServiceTicketService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/']);
      return;
    }

    // Check for ticketId query parameter
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.highlightedTicketId = params['ticketId'] || null;
      });

    this.loadServiceRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadServiceRequests(): void {
    this.isLoading = true;

    this.serviceTicketService.listTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tickets) => {
          this.serviceRequests = tickets;
          this.applyFilters();
          this.isLoading = false;

          // Scroll to highlighted ticket if present
          if (this.highlightedTicketId) {
            setTimeout(() => {
              const element = document.getElementById(`ticket-${this.highlightedTicketId}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        },
        error: (err) => {
          console.error('Error loading service tickets:', err);
          this.isLoading = false;
        }
      });
  }

  applyFilters(): void {
    this.filteredRequests = this.serviceRequests.filter(ticket => {
      const matchesStatus = this.selectedStatus === 'all' || ticket.status === this.selectedStatus;
      const matchesType = this.selectedType === 'all' || ticket.data.requestType === this.selectedType;
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
      case 'submitted':
        return 'status-pending';
      case 'open':
        return 'status-progress';
      case 'in_progress':
        return 'status-progress';
      case 'pending_customer':
        return 'status-pending';
      case 'resolved':
        return 'status-completed';
      case 'closed':
        return 'status-completed';
      case 'processing':
        return 'status-progress';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      case 'warranty_claim':
        return '🛡️';
      case 'inspection':
        return '🔍';
      case 'replacement':
        return '🔄';
      default:
        return '📋';
    }
  }

  getTypeLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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

  viewRequestDetails(ticket: ServiceTicket): void {
    this.selectedTicket = ticket;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedTicket = null;
  }
}
