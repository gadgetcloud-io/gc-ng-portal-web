import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServiceTicket, TicketMessage } from '../../../../core/models/service-ticket.model';
import { RbacService, FieldConfig } from '../../../../core/services/rbac.service';
import { AuthService, User } from '../../../../core/services/auth.service';
import { ServiceTicketService } from '../../../../core/services/service-ticket.service';

@Component({
  selector: 'app-ticket-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

          <!-- Editable Fields (Support/Admin only) -->
          <div class="editable-fields-section" *ngIf="canEditFields">
            <h3 class="section-title">Manage Ticket</h3>

            <!-- Status -->
            <div class="field-edit-row">
              <label>Status</label>
              <div class="field-display" *ngIf="!editMode['status']">
                <span class="status-badge" [style.background-color]="getStatusColor(ticket.status)">
                  {{ formatStatus(ticket.status) }}
                </span>
                <button class="edit-icon-btn" (click)="enterEditMode('status')"
                        [disabled]="!isFieldEditable('status')">✏️</button>
              </div>
              <div class="field-edit-mode" *ngIf="editMode['status']">
                <select [(ngModel)]="editValues['status']" class="form-input">
                  <option *ngFor="let val of fieldConfigs['status']?.allowedValues" [value]="val">
                    {{ formatStatus(val) }}
                  </option>
                </select>
                <button class="btn-save" (click)="saveField('status')">Save</button>
                <button class="btn-cancel" (click)="cancelEdit('status')">Cancel</button>
              </div>
            </div>

            <!-- Priority -->
            <div class="field-edit-row">
              <label>Priority</label>
              <div class="field-display" *ngIf="!editMode['priority']">
                <span class="priority-badge" [style.background-color]="getPriorityColor(ticket.priority)">
                  {{ ticket.priority }}
                </span>
                <button class="edit-icon-btn" (click)="enterEditMode('priority')"
                        [disabled]="!isFieldEditable('priority')">✏️</button>
              </div>
              <div class="field-edit-mode" *ngIf="editMode['priority']">
                <select [(ngModel)]="editValues['priority']" class="form-input">
                  <option *ngFor="let val of fieldConfigs['priority']?.allowedValues" [value]="val">
                    {{ val }}
                  </option>
                </select>
                <button class="btn-save" (click)="saveField('priority')">Save</button>
                <button class="btn-cancel" (click)="cancelEdit('priority')">Cancel</button>
              </div>
            </div>

            <!-- Assigned To -->
            <div class="field-edit-row">
              <label>Assigned To</label>
              <div class="field-display" *ngIf="!editMode['assignedTo']">
                <span>{{ ticket.assignedTo || 'Unassigned' }}</span>
                <button class="edit-icon-btn" (click)="enterEditMode('assignedTo')"
                        [disabled]="!isFieldEditable('assignedTo')">✏️</button>
              </div>
              <div class="field-edit-mode" *ngIf="editMode['assignedTo']">
                <input type="text" [(ngModel)]="editValues['assignedTo']"
                       class="form-input" placeholder="Enter email or name" [maxLength]="100">
                <button class="btn-save" (click)="saveField('assignedTo')">Save</button>
                <button class="btn-cancel" (click)="cancelEdit('assignedTo')">Cancel</button>
              </div>
            </div>
          </div>

          <!-- Feedback Messages -->
          <div class="feedback-messages" *ngIf="updateSuccess || updateError">
            <div class="success-message" *ngIf="updateSuccess">✓ {{ updateSuccess }}</div>
            <div class="error-message" *ngIf="updateError">✗ {{ updateError }}</div>
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

          <!-- Message Thread -->
          <div class="message-section">
            <div class="message-header">
              <h3>Messages ({{ visibleMessages.length }})</h3>
              <button class="refresh-btn" (click)="refreshMessages()"
                      [disabled]="loadingMessages">🔄 Refresh</button>
            </div>

            <div class="loading-messages" *ngIf="loadingMessages">Loading messages...</div>

            <div class="empty-messages" *ngIf="!loadingMessages && visibleMessages.length === 0">
              No messages yet. Start the conversation!
            </div>

            <div class="message-thread" *ngIf="!loadingMessages && visibleMessages.length > 0">
              <div class="message-item" *ngFor="let msg of visibleMessages"
                   [class.message-own]="msg.senderId === currentUser?.id"
                   [class.internal-note]="msg.isInternal">
                <div class="message-header-line">
                  <span class="sender-name">{{ msg.senderName }}</span>
                  <span class="sender-role" [class]="'role-' + msg.senderRole">
                    {{ msg.senderRole }}
                  </span>
                  <span class="internal-badge" *ngIf="msg.isInternal">🔒 Internal</span>
                  <span class="message-time">{{ formatMessageTime(msg.createdAt) }}</span>
                </div>
                <div class="message-text">{{ msg.message }}</div>
              </div>
            </div>

            <div class="message-input-area">
              <textarea [(ngModel)]="newMessageText"
                        placeholder="Type your message..."
                        class="message-input"
                        rows="3"
                        [disabled]="sendingMessage"
                        (keydown)="onMessageKeydown($event)">
              </textarea>
              <div class="message-actions">
                <div class="left-actions">
                  <span class="input-hint">Ctrl+Enter to send</span>
                  <label class="internal-checkbox" *ngIf="canSeeInternalNotes">
                    <input type="checkbox" [(ngModel)]="markAsInternal">
                    <span>Internal note (support only)</span>
                  </label>
                </div>
                <button class="btn-send"
                        (click)="sendMessage()"
                        [disabled]="!newMessageText.trim() || sendingMessage">
                  {{ sendingMessage ? 'Sending...' : (markAsInternal ? 'Add Note' : 'Send') }}
                </button>
              </div>
            </div>
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

    /* Editable Fields Section */
    .editable-fields-section {
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: #f8fafc;
      border-radius: var(--radius-md);
      border: 1px solid var(--neutral-200);
    }

    .editable-fields-section .section-title {
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--neutral-900);
      margin: 0 0 var(--space-4) 0;
    }

    .field-edit-row {
      margin-bottom: var(--space-3);
    }

    .field-edit-row label {
      display: block;
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--neutral-700);
      margin-bottom: var(--space-2);
    }

    .field-display {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .field-edit-mode {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    .form-input {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      border: 2px solid var(--neutral-300);
      border-radius: var(--radius-sm);
      font-size: var(--text-base);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--brand-primary-700);
    }

    .btn-save,
    .btn-cancel {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .btn-save {
      background: var(--brand-primary-700);
      color: white;
      border: none;
    }

    .btn-save:hover {
      background: var(--brand-primary-800);
    }

    .btn-cancel {
      background: transparent;
      color: var(--neutral-700);
      border: 1px solid var(--neutral-300);
    }

    .btn-cancel:hover {
      background: var(--neutral-100);
    }

    .edit-icon-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: var(--space-1);
      opacity: 0.6;
      transition: opacity var(--transition-base);
    }

    .edit-icon-btn:hover:not(:disabled) {
      opacity: 1;
    }

    .edit-icon-btn:disabled {
      cursor: not-allowed;
      opacity: 0.3;
    }

    /* Feedback Messages */
    .feedback-messages {
      margin-bottom: var(--space-4);
    }

    .success-message {
      padding: var(--space-3) var(--space-4);
      background: #d1fae5;
      border: 1px solid #6ee7b7;
      border-radius: var(--radius-md);
      color: #065f46;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
    }

    .error-message {
      padding: var(--space-3) var(--space-4);
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: var(--radius-md);
      color: #991b1b;
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
    }

    /* Message Section */
    .message-section {
      margin-top: var(--space-6);
      border-top: 2px solid var(--neutral-200);
      padding-top: var(--space-6);
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .message-header h3 {
      margin: 0;
      font-size: var(--text-lg);
      font-weight: var(--font-semibold);
      color: var(--neutral-900);
    }

    .refresh-btn {
      padding: var(--space-2) var(--space-3);
      background: transparent;
      border: 1px solid var(--neutral-300);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--neutral-100);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .loading-messages,
    .empty-messages {
      padding: var(--space-8);
      text-align: center;
      color: var(--neutral-500);
      font-size: var(--text-sm);
    }

    .message-thread {
      max-height: 400px;
      overflow-y: auto;
      padding: var(--space-4);
      background: #f9fafb;
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
    }

    .message-item {
      margin-bottom: var(--space-4);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      background: white;
      border: 1px solid var(--neutral-200);
    }

    .message-item.message-own {
      background: #e0f2fe;
      border-color: #7dd3fc;
      margin-left: var(--space-8);
    }

    .message-item:not(.message-own) {
      margin-right: var(--space-8);
    }

    .message-item.internal-note {
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
    }

    .message-header-line {
      display: flex;
      gap: var(--space-2);
      align-items: center;
      margin-bottom: var(--space-2);
      font-size: var(--text-sm);
    }

    .sender-name {
      font-weight: var(--font-semibold);
      color: var(--neutral-900);
    }

    .sender-role {
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      text-transform: uppercase;
    }

    .sender-role.role-customer {
      background: #dbeafe;
      color: #1e40af;
    }

    .sender-role.role-support {
      background: #fef3c7;
      color: #92400e;
    }

    .sender-role.role-admin {
      background: #fce7f3;
      color: #831843;
    }

    .internal-badge {
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      background: #fef3c7;
      color: #92400e;
    }

    .message-time {
      margin-left: auto;
      color: var(--neutral-500);
      font-size: var(--text-xs);
    }

    .message-text {
      color: var(--neutral-800);
      line-height: var(--leading-relaxed);
      white-space: pre-wrap;
    }

    .message-input-area {
      margin-top: var(--space-4);
    }

    .message-input {
      width: 100%;
      padding: var(--space-3);
      border: 2px solid var(--neutral-300);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
      font-family: inherit;
      resize: vertical;
      min-height: 80px;
    }

    .message-input:focus {
      outline: none;
      border-color: var(--brand-primary-700);
    }

    .message-input:disabled {
      background: var(--neutral-100);
      cursor: not-allowed;
    }

    .message-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--space-2);
    }

    .left-actions {
      display: flex;
      gap: var(--space-4);
      align-items: center;
    }

    .input-hint {
      font-size: var(--text-xs);
      color: var(--neutral-500);
    }

    .internal-checkbox {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--neutral-700);
      cursor: pointer;
    }

    .internal-checkbox input[type="checkbox"] {
      cursor: pointer;
    }

    .btn-send {
      padding: var(--space-2) var(--space-6);
      background: var(--brand-primary-700);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: var(--font-medium);
      cursor: pointer;
      transition: all var(--transition-base);
    }

    .btn-send:hover:not(:disabled) {
      background: var(--brand-primary-800);
    }

    .btn-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

      .message-item.message-own {
        margin-left: var(--space-2);
      }

      .message-item:not(.message-own) {
        margin-right: var(--space-2);
      }
    }
  `]
})
export class TicketDetailModalComponent implements OnInit, OnChanges, OnDestroy {
  @Input() ticket: ServiceTicket | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() ticketUpdated = new EventEmitter<ServiceTicket>();

  // User & permissions
  currentUser: User | null = null;
  canEditFields = false;
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
    private rbacService: RbacService,
    private authService: AuthService,
    private serviceTicketService: ServiceTicketService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.updatePermissions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen && this.ticket) {
        this.loadFieldConfigs();
        this.loadMessages();
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
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
    this.canSeeInternalNotes = role === 'support' || role === 'admin' || role === 'partner';
    this.cdr.detectChanges();
  }

  private loadFieldConfigs(): void {
    if (!this.canEditFields) return;

    this.loadingFieldConfigs = true;
    this.rbacService.getFieldConfig('gc-service-tickets')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (configs) => {
          this.fieldConfigs = configs;
          this.loadingFieldConfigs = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading field configs:', err);
          this.loadingFieldConfigs = false;
          this.cdr.detectChanges();
        }
      });
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
          this.cdr.detectChanges();
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (err) => {
          console.error('Error loading messages:', err);
          this.loadingMessages = false;
          this.cdr.detectChanges();
        }
      });
  }

  private startAutoRefresh(): void {
    this.refreshInterval = window.setInterval(() => {
      if (this.isOpen && this.ticket) {
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

  private scrollToBottom(): void {
    const element = document.querySelector('.message-thread');
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  isFieldEditable(field: string): boolean {
    if (!this.canEditFields || this.loadingFieldConfigs || this.isUpdating) {
      return false;
    }
    const config = this.fieldConfigs[field];
    return config?.type === 'enum' ? !!(config.allowedValues?.length) : !!config;
  }

  enterEditMode(field: string): void {
    if (!this.ticket || !this.isFieldEditable(field)) return;
    this.editValues[field] = this.ticket[field as keyof ServiceTicket];
    this.editMode[field] = true;
    this.cdr.detectChanges();
  }

  cancelEdit(field: string): void {
    delete this.editMode[field];
    delete this.editValues[field];
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
    this.cdr.detectChanges();

    // API call
    this.rbacService.updateField({
      collection: 'gc-service-tickets',
      documentId: this.ticket.id,
      field: field,
      value: newValue,
      reason: `Updated ${this.formatFieldName(field)} via ticket modal`
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (this.ticket) {
          (this.ticket as any)[field] = response.newValue;
        }

        this.updateSuccess = `${this.formatFieldName(field)} updated`;
        this.ticketUpdated.emit(this.ticket!);

        setTimeout(() => {
          this.updateSuccess = null;
          this.cdr.detectChanges();
        }, 1500);

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
          this.cdr.detectChanges();
        }, 5000);

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
            this.cdr.detectChanges();
          }, 3000);
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
