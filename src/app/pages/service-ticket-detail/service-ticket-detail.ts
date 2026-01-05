import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServiceTicket, TicketMessage } from '../../core/models/service-ticket.model';
import { RbacService, FieldConfig } from '../../core/services/rbac.service';
import { AuthService, User } from '../../core/services/auth.service';
import { ServiceTicketService } from '../../core/services/service-ticket.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { DocumentsManagerComponent } from '../../shared/components/documents-manager/documents-manager.component';

type TabId = 'overview' | 'messages' | 'documents' | 'activity';

@Component({
  selector: 'gc-service-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentsManagerComponent],
  templateUrl: './service-ticket-detail.html',
  styleUrl: './service-ticket-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceTicketDetailComponent implements OnInit, OnDestroy {
  // Ticket data
  ticket: ServiceTicket | null = null;
  ticketId: string = '';

  // Page state
  loading = false;
  error: string | null = null;

  // Tab state
  activeTab: TabId = 'overview';

  // User & permissions
  currentUser: User | null = null;
  canEditFields = false;
  canEditOwnTicket = false;
  canSeeInternalNotes = false;

  // RBAC state
  fieldConfigs: { [field: string]: FieldConfig } = {};
  loadingFieldConfigs = false;

  // Field editing
  editMode: { [key: string]: boolean } = {};
  editValues: { [key: string]: any } = {};
  isUpdating = false;

  // Messages
  messages: TicketMessage[] = [];
  loadingMessages = false;
  sendingMessage = false;
  newMessageText = '';
  markAsInternal = false;

  // Feedback
  updateError: string | null = null;
  updateSuccess: string | null = null;

  // Auto-refresh
  private refreshInterval?: number;

  // Lifecycle
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private rbacService: RbacService,
    private authService: AuthService,
    private serviceTicketService: ServiceTicketService,
    private breadcrumbService: BreadcrumbService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Get current user & check auth
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigate(['/']);
      return;
    }

    // 2. Get ticket ID from route
    this.ticketId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.ticketId) {
      this.error = 'No ticket ID provided';
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }

    // 3. Update permissions
    this.updatePermissions();

    // 4. Load ticket data (optimized for speed)
    this.loading = true;

    // Load ticket first for immediate UI display
    this.serviceTicketService.getTicket(this.ticketId).subscribe({
      next: (ticket) => {
        this.ticket = ticket;
        this.breadcrumbService.setLabel(`/service-requests/${this.ticketId}`, ticket.id);
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading ticket:', err);
        this.error = err.message || 'Failed to load ticket details';
        this.loading = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });

    // Load messages in background
    this.serviceTicketService.getMessages(this.ticketId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.cdr.markForCheck();
        this.cdr.detectChanges();

        // Start auto-refresh and scroll after messages load
        this.startAutoRefresh();
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (err) => {
        console.error('Error loading messages:', err);
      }
    });

    // Load field configs in background (if customer or support needs to edit)
    if (this.canEditFields || this.canEditOwnTicket) {
      this.rbacService.getFieldConfig('gc-service-tickets').subscribe({
        next: (configs) => {
          this.fieldConfigs = configs;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading field configs:', err);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePermissions(): void {
    const role = this.currentUser?.role;
    this.canEditFields = role === 'support' || role === 'admin';
    this.canEditOwnTicket = role === 'customer' || role === 'partner';
    this.canSeeInternalNotes = role === 'support' || role === 'admin' || role === 'partner';
    this.cdr.markForCheck();
      this.cdr.detectChanges();
  }

  private startAutoRefresh(): void {
    this.refreshInterval = window.setInterval(() => {
      if (this.ticket) {
        this.loadMessages();
      }
    }, 30000); // 30 seconds
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  private loadMessages(): void {
    if (!this.ticket) return;

    this.loadingMessages = true;
    this.serviceTicketService.getMessages(this.ticket.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.loadingMessages = false;
          this.cdr.markForCheck();
      this.cdr.detectChanges();
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.loadingMessages = false;
          this.cdr.markForCheck();
      this.cdr.detectChanges();
        }
      });
  }

  private scrollToBottom(): void {
    const element = document.querySelector('.message-thread');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  navigateBack(): void {
    this.router.navigate(['/service-requests']);
  }

  // Tab Navigation
  switchTab(tabId: TabId): void {
    this.activeTab = tabId;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  isFieldEditable(field: string): boolean {
    if (this.loadingFieldConfigs || this.isUpdating) {
      return false;
    }

    // Customers can only edit status, priority, and urgency on their own tickets
    if (this.canEditOwnTicket && !this.canEditFields) {
      if (field !== 'status' && field !== 'priority' && field !== 'urgency') {
        return false;
      }
    }

    // Support/admin can edit any field based on RBAC config
    if (!this.canEditFields && !this.canEditOwnTicket) {
      return false;
    }

    const config = this.fieldConfigs[field];
    return config?.type === 'enum' ? !!(config.allowedValues?.length) : !!config;
  }

  enterEditMode(field: string): void {
    if (!this.ticket || !this.isFieldEditable(field)) return;
    this.editValues[field] = this.ticket[field as keyof ServiceTicket];
    this.editMode[field] = true;
    this.cdr.markForCheck();
      this.cdr.detectChanges();
  }

  cancelEdit(field: string): void {
    delete this.editMode[field];
    delete this.editValues[field];
    this.cdr.markForCheck();
      this.cdr.detectChanges();
  }

  saveField(field: string): void {
    if (!this.ticket || this.isUpdating) return;

    const newValue = this.editValues[field];
    const oldValue = this.ticket[field as keyof ServiceTicket];

    if (newValue === oldValue) {
      this.cancelEdit(field);
      return;
    }

    // Exit edit mode
    delete this.editMode[field];
    delete this.editValues[field];

    // Optimistic update
    const previousValue = this.ticket[field as keyof ServiceTicket];
    (this.ticket as any)[field] = newValue;

    this.updateError = null;
    this.updateSuccess = null;
    this.cdr.markForCheck();
      this.cdr.detectChanges();

    // API call
    this.rbacService.updateField({
      collection: 'gc-service-tickets',
      documentId: this.ticket.id,
      field: field,
      value: newValue,
      reason: `Updated ${this.formatFieldName(field)} via ticket detail page`
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (this.ticket) {
          (this.ticket as any)[field] = response.newValue;
        }

        this.updateSuccess = `${this.formatFieldName(field)} updated`;

        setTimeout(() => {
          this.updateSuccess = null;
          this.cdr.markForCheck();
      this.cdr.detectChanges();
        }, 1500);

        this.cdr.markForCheck();
      this.cdr.detectChanges();
      },
      error: (err) => {
        // Revert optimistic update
        if (this.ticket) {
          (this.ticket as any)[field] = previousValue;
        }

        this.updateError = err.message || 'Failed to update field';

        setTimeout(() => {
          this.updateError = null;
          this.cdr.markForCheck();
      this.cdr.detectChanges();
        }, 5000);

        this.cdr.markForCheck();
      this.cdr.detectChanges();
      }
    });
  }

  private formatFieldName(field: string): string {
    return field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }

  onMessageKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && keyboardEvent.ctrlKey) {
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (!this.ticket || !this.newMessageText.trim() || this.sendingMessage) return;

    const messageText = this.newMessageText.trim();
    const isInternal = this.markAsInternal;

    this.sendingMessage = true;
    this.newMessageText = '';
    this.markAsInternal = false;

    this.serviceTicketService.addMessage(this.ticket.id, messageText, isInternal)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadMessages();
          this.sendingMessage = false;
          this.cdr.markForCheck();
      this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error sending message:', err);
          this.newMessageText = messageText;
          this.markAsInternal = isInternal;
          this.updateError = isInternal ? 'Failed to add note' : 'Failed to send message';
          this.sendingMessage = false;
          setTimeout(() => {
            this.updateError = null;
            this.cdr.markForCheck();
      this.cdr.detectChanges();
          }, 3000);
          this.cdr.markForCheck();
      this.cdr.detectChanges();
        }
      });
  }

  get visibleMessages(): TicketMessage[] {
    if (this.canSeeInternalNotes) {
      return this.messages;
    }
    return this.messages.filter(msg => !msg.isInternal);
  }

  refreshMessages(): void {
    this.loadMessages();
  }

  formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
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

  formatDateTime(dateStr: string | undefined): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
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

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'urgent': '#ef4444',
      'high': '#f59e0b',
      'normal': '#3b82f6',
      'low': '#6b7280'
    };
    return colors[priority] || '#6b7280';
  }
}
