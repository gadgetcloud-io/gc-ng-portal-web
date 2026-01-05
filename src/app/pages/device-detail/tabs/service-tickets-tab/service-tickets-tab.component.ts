import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Device } from '../../../../core/services/device.service';
import { ServiceTicket, ServiceTicketStatus, TicketPriority, CreateTicketRequest, RequestType } from '../../../../core/models/service-ticket.model';
import { ServiceTicketService } from '../../../../core/services/service-ticket.service';
import { CreateServiceRequestDialogComponent, ServiceRequestData } from '../../../../shared/components/service-request-dialogs/create-service-request-dialog';

@Component({
  selector: 'app-service-tickets-tab',
  standalone: true,
  imports: [
    CommonModule,
    CreateServiceRequestDialogComponent
  ],
  templateUrl: './service-tickets-tab.component.html',
  styleUrl: './service-tickets-tab.component.scss'
})
export class ServiceTicketsTabComponent implements OnInit, OnDestroy {
  @Input() device: Device | null = null;

  tickets: ServiceTicket[] = [];
  isLoading = false;
  error: string | null = null;

  // Dialog states
  isCreateDialogOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    private serviceTicketService: ServiceTicketService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTickets(): void {
    if (!this.device) return;

    this.isLoading = true;
    this.error = null;

    this.serviceTicketService.listTickets(this.device.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tickets) => {
          this.tickets = tickets;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'Failed to load service tickets';
          this.isLoading = false;
          console.error('Error loading tickets:', err);
        }
      });
  }

  openCreateDialog(): void {
    this.isCreateDialogOpen = true;
  }

  closeCreateDialog(): void {
    this.isCreateDialogOpen = false;
  }

  onTicketCreated(requestData: ServiceRequestData): void {
    // Map to backend format
    const request: CreateTicketRequest = {
      formType: 'service_request',
      data: {
        requestType: requestData.requestType as RequestType,
        deviceId: requestData.deviceId,
        urgency: this.mapPriorityToUrgency(requestData.priority),
        issueDescription: requestData.description,
        additionalNotes: requestData.subject
      },
      _website: '' // Honeypot
    };

    this.serviceTicketService.createTicket(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadTickets(); // Refresh list
          this.closeCreateDialog();
        },
        error: (err) => {
          console.error('Error creating ticket:', err);
          alert('Failed to create service ticket. Please try again.');
        }
      });
  }

  viewTicketDetails(ticket: ServiceTicket): void {
    this.router.navigate(['/service-requests', ticket.id]);
  }

  private mapPriorityToUrgency(priority: string): 'low' | 'normal' | 'high' | 'critical' {
    const map: Record<string, 'low' | 'normal' | 'high' | 'critical'> = {
      'low': 'low',
      'medium': 'normal',
      'high': 'high',
      'urgent': 'critical'
    };
    return map[priority] || 'normal';
  }

  getStatusColor(status: ServiceTicketStatus): string {
    const colors: Record<ServiceTicketStatus, string> = {
      'submitted': '#6b7280',
      'open': '#3b82f6',
      'in_progress': '#f59e0b',
      'pending_customer': '#eab308',
      'resolved': '#10b981',
      'closed': '#6b7280',
      'processing': '#8b5cf6',
      'completed': '#10b981',
      'failed': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  getPriorityColor(priority: TicketPriority): string {
    const colors: Record<TicketPriority, string> = {
      'urgent': '#ef4444',
      'high': '#f59e0b',
      'normal': '#3b82f6',
      'low': '#6b7280'
    };
    return colors[priority] || '#6b7280';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatRequestType(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getRequestTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'repair': '🔧',
      'maintenance': '🛠️',
      'warranty_claim': '🛡️',
      'inspection': '🔍',
      'replacement': '🔄'
    };
    return icons[type] || '📝';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
