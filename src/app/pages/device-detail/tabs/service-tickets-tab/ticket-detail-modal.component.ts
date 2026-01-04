import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServiceTicket } from '../../../../core/models/service-ticket.model';

@Component({
  selector: 'app-ticket-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="modal-header">
          <h2>Service Ticket Details</h2>
          <button class="close-btn" (click)="onClose()">✕</button>
        </div>

        <!-- Modal Body -->
        <div class="modal-body" *ngIf="ticket">
          <!-- Ticket ID and Status -->
          <div class="ticket-header-section">
            <div class="ticket-id-large">{{ ticket.id }}</div>
            <div class="badges">
              <span class="status-badge" [style.background-color]="getStatusColor(ticket.status)">
                {{ formatStatus(ticket.status) }}
              </span>
              <span class="priority-badge" [style.background-color]="getPriorityColor(ticket.priority)">
                {{ ticket.priority }}
              </span>
            </div>
          </div>

          <!-- Request Type -->
          <div class="detail-section">
            <label>Request Type</label>
            <div class="request-type-display">
              <span class="icon">{{ getRequestTypeIcon(ticket.data.requestType) }}</span>
              <span>{{ formatRequestType(ticket.data.requestType) }}</span>
            </div>
          </div>

          <!-- Issue Description -->
          <div class="detail-section">
            <label>Issue Description</label>
            <p class="description-text">{{ ticket.data.issueDescription }}</p>
          </div>

          <!-- Additional Notes -->
          <div class="detail-section" *ngIf="ticket.data.additionalNotes">
            <label>Additional Notes</label>
            <p class="notes-text">{{ ticket.data.additionalNotes }}</p>
          </div>

          <!-- Urgency -->
          <div class="detail-section" *ngIf="ticket.data.urgency">
            <label>Urgency</label>
            <span class="urgency-badge">{{ ticket.data.urgency }}</span>
          </div>

          <!-- Assigned To -->
          <div class="detail-section" *ngIf="ticket.assignedTo">
            <label>Assigned To</label>
            <div class="assigned-display">
              <span class="icon">👤</span>
              <span>{{ ticket.assignedTo }}</span>
            </div>
          </div>

          <!-- Timestamps -->
          <div class="detail-section">
            <label>Created</label>
            <p>{{ formatDateTime(ticket.createdAt) }}</p>
          </div>

          <div class="detail-section">
            <label>Last Updated</label>
            <p>{{ formatDateTime(ticket.updatedAt) }}</p>
          </div>

          <!-- Email Status -->
          <div class="detail-section">
            <label>Email Notification</label>
            <p>
              <span *ngIf="ticket.emailSent" class="status-success">✓ Sent</span>
              <span *ngIf="!ticket.emailSent" class="status-pending">⏳ Pending</span>
              <span *ngIf="ticket.emailSentAt"> at {{ formatDateTime(ticket.emailSentAt) }}</span>
            </p>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="modal-footer">
          <button class="btn-secondary" (click)="onClose()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--space-4);
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-lg);
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-2xl);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--neutral-200);
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-2xl);
      color: var(--neutral-900);
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: var(--text-2xl);
      cursor: pointer;
      color: var(--neutral-500);
      padding: var(--space-2);
      line-height: 1;
      transition: color var(--transition-base);
    }

    .close-btn:hover {
      color: var(--neutral-900);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .ticket-header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding-bottom: var(--space-4);
      border-bottom: 2px solid var(--neutral-200);
    }

    .ticket-id-large {
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      color: var(--brand-primary-700);
    }

    .badges {
      display: flex;
      gap: var(--space-2);
    }

    .status-badge,
    .priority-badge,
    .urgency-badge {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      color: white;
      text-transform: capitalize;
    }

    .detail-section {
      margin-bottom: var(--space-4);
    }

    .detail-section label {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--neutral-700);
      margin-bottom: var(--space-2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .request-type-display,
    .assigned-display {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .description-text,
    .notes-text {
      color: var(--neutral-800);
      line-height: var(--leading-relaxed);
      margin: 0;
    }

    .status-success {
      color: var(--color-success);
      font-weight: var(--font-medium);
    }

    .status-pending {
      color: var(--color-warning);
      font-weight: var(--font-medium);
    }

    .modal-footer {
      padding: var(--space-6);
      border-top: 1px solid var(--neutral-200);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .btn-secondary {
      padding: var(--space-3) var(--space-6);
      background: var(--neutral-100);
      color: var(--neutral-700);
      border: 1px solid var(--neutral-300);
      border-radius: var(--radius-md);
      font-weight: var(--font-medium);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .btn-secondary:hover {
      background: var(--neutral-200);
      border-color: var(--neutral-400);
    }

    @media (max-width: 640px) {
      .modal-content {
        max-height: 100vh;
        border-radius: 0;
      }

      .ticket-header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }
    }
  `]
})
export class TicketDetailModalComponent {
  @Input() ticket: ServiceTicket | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
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
