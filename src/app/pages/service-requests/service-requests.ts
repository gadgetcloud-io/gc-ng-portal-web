import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService, User } from '../../core/services/auth.service';
import { ServiceTicketService } from '../../core/services/service-ticket.service';
import { ServiceTicket, EnrichedServiceTicket, SupportStaff, AssignmentFilter } from '../../core/models/service-ticket.model';

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './service-requests.html',
  styleUrl: './service-requests.scss'
})
export class ServiceRequestsComponent implements OnInit, OnDestroy {
  user: User | null = null;
  serviceRequests: EnrichedServiceTicket[] = [];
  filteredRequests: EnrichedServiceTicket[] = [];
  isLoading = false;
  isRedirecting = false;
  selectedStatus = 'all';
  selectedType = 'all';

  // Support role features
  isSupportRole = false;
  supportStaff: SupportStaff[] = [];
  selectedAssignment: AssignmentFilter = 'all';
  searchTerm = '';
  assignmentDropdownOpen: { [ticketId: string]: boolean } = {};
  assigningTicket: { [ticketId: string]: boolean } = {};

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
    private serviceTicketService: ServiceTicketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      this.router.navigate(['/']);
      return;
    }

    // Check if user is support or admin
    this.isSupportRole = this.user.role === 'support' || this.user.role === 'admin';

    // Redirect old URL format to new format (backward compatibility)
    const ticketId = this.route.snapshot.queryParams['ticketId'];
    if (ticketId) {
      this.isRedirecting = true;
      this.cdr.detectChanges();
      // Use setTimeout to ensure UI updates before navigation
      setTimeout(() => {
        this.router.navigate(['/service-requests', ticketId], { replaceUrl: true });
      }, 0);
      return;
    }

    this.loadServiceRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadServiceRequests(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    // Support/admin: Load enriched tickets + support staff in parallel
    if (this.isSupportRole) {
      forkJoin({
        tickets: this.serviceTicketService.listEnrichedTickets(),
        staff: this.serviceTicketService.getSupportStaff()
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (results) => {
            this.serviceRequests = results.tickets;
            this.supportStaff = results.staff;
            this.applyFilters();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error loading tickets:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
    } else {
      // Customer: Load regular tickets
      this.serviceTicketService.listTickets()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (tickets) => {
            this.serviceRequests = tickets as EnrichedServiceTicket[];
            this.applyFilters();
            this.isLoading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error loading tickets:', err);
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        });
    }
  }

  applyFilters(): void {
    this.filteredRequests = this.serviceRequests.filter(ticket => {
      const matchesStatus = this.selectedStatus === 'all' || ticket.status === this.selectedStatus;
      const matchesType = this.selectedType === 'all' || ticket.data.requestType === this.selectedType;

      // Assignment filter (support only)
      let matchesAssignment = true;
      if (this.isSupportRole) {
        if (this.selectedAssignment === 'assigned-to-me') {
          matchesAssignment = ticket.assignedTo === this.user?.id;
        } else if (this.selectedAssignment === 'unassigned') {
          matchesAssignment = !ticket.assignedTo;
        }
      }

      // Search filter (support only)
      let matchesSearch = true;
      if (this.isSupportRole && this.searchTerm.trim()) {
        const term = this.searchTerm.toLowerCase();
        matchesSearch = !!(
          ticket.id.toLowerCase().includes(term) ||
          ticket.data.issueDescription?.toLowerCase().includes(term) ||
          ticket.customer?.name?.toLowerCase().includes(term) ||
          ticket.customer?.email?.toLowerCase().includes(term) ||
          ticket.device?.name?.toLowerCase().includes(term) ||
          ticket.device?.brand?.toLowerCase().includes(term)
        );
      }

      return matchesStatus && matchesType && matchesAssignment && matchesSearch;
    });
    this.cdr.detectChanges();
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
    // TODO: Implement new ticket dialog
    alert('New ticket dialog will be implemented. This will allow users to create new support tickets.');
  }

  onAssignmentChange(event: Event): void {
    this.selectedAssignment = (event.target as HTMLSelectElement).value as AssignmentFilter;
    this.applyFilters();
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  toggleAssignmentDropdown(ticketId: string, event: Event): void {
    event.stopPropagation();
    // Close all other dropdowns
    Object.keys(this.assignmentDropdownOpen).forEach(id => {
      if (id !== ticketId) {
        this.assignmentDropdownOpen[id] = false;
      }
    });
    // Toggle current dropdown
    this.assignmentDropdownOpen[ticketId] = !this.assignmentDropdownOpen[ticketId];
  }

  assignToStaff(ticket: EnrichedServiceTicket, staffId: string, event: Event): void {
    event.stopPropagation();
    this.assignmentDropdownOpen[ticket.id] = false;
    this.performAssignment(ticket, staffId);
  }

  assignToMe(ticket: EnrichedServiceTicket, event: Event): void {
    event.stopPropagation();
    if (this.user?.id) {
      this.performAssignment(ticket, this.user.id);
    }
  }

  unassignTicket(ticket: EnrichedServiceTicket, event: Event): void {
    event.stopPropagation();
    this.assignmentDropdownOpen[ticket.id] = false;
    this.performAssignment(ticket, null);
  }

  private performAssignment(ticket: EnrichedServiceTicket, assignedTo: string | null): void {
    if (this.assigningTicket[ticket.id]) return; // Prevent duplicate requests

    const previousValue = ticket.assignedTo;

    // Optimistic update
    ticket.assignedTo = assignedTo || undefined;
    this.applyFilters(); // Re-filter in case assignment filter is active
    this.assigningTicket[ticket.id] = true;

    this.serviceTicketService.updateAssignment(ticket.id, assignedTo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.assigningTicket[ticket.id] = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error updating assignment:', err);
          // Revert optimistic update
          ticket.assignedTo = previousValue;
          this.applyFilters();
          this.assigningTicket[ticket.id] = false;
          this.cdr.detectChanges();
        }
      });
  }

  getAssignedStaffName(assignedTo: string | undefined): string {
    if (!assignedTo) return 'Unassigned';
    const staff = this.supportStaff.find(s => s.id === assignedTo);
    return staff ? staff.name : assignedTo;
  }

  viewRequestDetails(ticket: ServiceTicket): void {
    this.router.navigate(['/service-requests', ticket.id]);
  }
}
