import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-warranty-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="warranty-timeline">
      <div class="timeline-header">
        <h4 class="timeline-title">Warranty Period</h4>
        <div class="timeline-status" [ngClass]="statusClass">
          <span class="status-dot"></span>
          <span class="status-text">{{ statusText }}</span>
        </div>
      </div>

      <div class="timeline-visual">
        <div class="timeline-track">
          <div class="timeline-progress" [style.width]="progressPercentage + '%'"></div>
        </div>

        <div class="timeline-markers">
          <div class="timeline-marker marker-start">
            <div class="marker-icon">📅</div>
            <div class="marker-label">Purchase Date</div>
            <div class="marker-date">{{ formatDate(purchaseDate) }}</div>
          </div>

          <div class="timeline-marker marker-current" [style.left]="progressPercentage + '%'" *ngIf="!isExpired">
            <div class="marker-icon marker-icon-current">📍</div>
            <div class="marker-label">Today</div>
            <div class="marker-date">{{ daysRemaining }} days left</div>
          </div>

          <div class="timeline-marker marker-end">
            <div class="marker-icon">{{ isExpired ? '⚠️' : '✓' }}</div>
            <div class="marker-label">Warranty Expires</div>
            <div class="marker-date">{{ formatDate(warrantyExpires) }}</div>
          </div>
        </div>
      </div>

      <div class="timeline-info" *ngIf="!isExpired && daysRemaining <= 30">
        <div class="info-icon">⏰</div>
        <div class="info-content">
          <p class="info-title">Warranty Expiring Soon</p>
          <p class="info-description">
            Your warranty expires in <strong>{{ daysRemaining }} days</strong>.
            Consider renewing or purchasing extended coverage.
          </p>
        </div>
      </div>

      <div class="timeline-info info-expired" *ngIf="isExpired">
        <div class="info-icon">❌</div>
        <div class="info-content">
          <p class="info-title">Warranty Expired</p>
          <p class="info-description">
            This warranty expired <strong>{{ Math.abs(daysRemaining) }} days ago</strong>.
            Contact the manufacturer for extended coverage options.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    // ===== WARRANTY TIMELINE =====
    .warranty-timeline {
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(0, 180, 166, 0.03), rgba(39, 199, 176, 0.03));
      border: 1px solid rgba(0, 180, 166, 0.2);
      border-radius: 16px;
      margin-top: 2rem;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .timeline-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--neutral-900, #111827);
      margin: 0;
    }

    .timeline-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;

      &.status-active {
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }

      &.status-expiring {
        background: rgba(251, 191, 36, 0.1);
        color: #d97706;
        border: 1px solid rgba(251, 191, 36, 0.3);
      }

      &.status-expired {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
        animation: pulse 2s infinite;
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    // ===== TIMELINE VISUAL =====
    .timeline-visual {
      position: relative;
      margin-bottom: 1.5rem;
    }

    .timeline-track {
      height: 8px;
      background: var(--neutral-200, #e5e7eb);
      border-radius: 4px;
      overflow: hidden;
      margin: 3rem 0;
    }

    .timeline-progress {
      height: 100%;
      background: linear-gradient(90deg, var(--brand-teal, #00B4A6), #27C7B0);
      border-radius: 4px;
      transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .timeline-markers {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: space-between;
    }

    .timeline-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;

      &.marker-start {
        left: 0;
        transform: translate(0, -50%);
      }

      &.marker-end {
        left: 100%;
        transform: translate(-100%, -50%);
      }

      &.marker-current {
        position: absolute;
        z-index: 10;
      }

      .marker-icon {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;

        &.marker-icon-current {
          animation: bounce 2s infinite;
        }
      }

      .marker-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--neutral-600, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.025em;
        white-space: nowrap;
      }

      .marker-date {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--neutral-900, #111827);
        white-space: nowrap;
      }
    }

    @keyframes bounce {
      0%, 100% { transform: translate(-50%, -50%) translateY(0); }
      50% { transform: translate(-50%, -50%) translateY(-8px); }
    }

    // ===== TIMELINE INFO =====
    .timeline-info {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: rgba(251, 191, 36, 0.05);
      border: 1px solid rgba(251, 191, 36, 0.2);
      border-radius: 12px;

      &.info-expired {
        background: rgba(239, 68, 68, 0.05);
        border-color: rgba(239, 68, 68, 0.2);
      }

      .info-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
      }

      .info-content {
        flex: 1;

        .info-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--neutral-900, #111827);
          margin: 0 0 0.25rem;
        }

        .info-description {
          font-size: 0.875rem;
          color: var(--neutral-700, #374151);
          line-height: 1.6;
          margin: 0;

          strong {
            font-weight: 600;
            color: var(--neutral-900, #111827);
          }
        }
      }
    }

    // ===== RESPONSIVE =====
    @media (max-width: 640px) {
      .warranty-timeline {
        padding: 1rem;
      }

      .timeline-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .timeline-marker {
        .marker-label,
        .marker-date {
          font-size: 0.6875rem;
        }
      }

      .timeline-info {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `]
})
export class WarrantyTimelineComponent {
  @Input() purchaseDate: string = '';
  @Input() warrantyExpires: string = '';

  Math = Math;

  get isExpired(): boolean {
    if (!this.warrantyExpires) return false;
    return new Date(this.warrantyExpires) < new Date();
  }

  get daysRemaining(): number {
    if (!this.warrantyExpires) return 0;

    const today = new Date();
    const expiryDate = new Date(this.warrantyExpires);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get progressPercentage(): number {
    if (!this.purchaseDate || !this.warrantyExpires) return 0;

    const start = new Date(this.purchaseDate);
    const end = new Date(this.warrantyExpires);
    const today = new Date();

    if (today < start) return 0;
    if (today > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();

    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  get statusText(): string {
    if (this.isExpired) return 'Expired';
    if (this.daysRemaining <= 30) return 'Expiring Soon';
    return 'Active';
  }

  get statusClass(): string {
    if (this.isExpired) return 'status-expired';
    if (this.daysRemaining <= 30) return 'status-expiring';
    return 'status-active';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}
