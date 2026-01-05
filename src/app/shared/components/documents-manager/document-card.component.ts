import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Document {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  uploadedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="document-card" [class.deleting]="isDeleting">
      <!-- Thumbnail -->
      <div class="document-thumbnail" (click)="onPreview()">
        <img
          *ngIf="document.thumbnailUrl"
          [src]="document.thumbnailUrl"
          [alt]="document.fileName"
          class="thumbnail-image"
          loading="lazy" />

        <div *ngIf="!document.thumbnailUrl" class="thumbnail-placeholder">
          <span class="file-icon">{{ getFileIcon() }}</span>
        </div>

        <div class="document-overlay">
          <div class="overlay-content">
            <button class="action-button action-preview" (click)="onPreview(); $event.stopPropagation()" title="Preview">
              👁️
            </button>
            <button class="action-button action-download" (click)="onDownload(); $event.stopPropagation()" title="Download">
              ⬇️
            </button>
            <button class="action-button action-delete" (click)="startDelete(); $event.stopPropagation()" title="Delete">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- Document Info -->
      <div class="document-info">
        <div class="document-type-badge">{{ formatDocumentType() }}</div>
        <div class="document-name" [title]="document.fileName">{{ document.fileName }}</div>
        <div class="document-meta">
          <span class="meta-item">{{ formatFileSize() }}</span>
          <span class="meta-separator">•</span>
          <span class="meta-item">{{ formatDate() }}</span>
        </div>
      </div>

      <!-- Delete Confirmation -->
      <div *ngIf="showDeleteConfirm" class="delete-confirmation">
        <p class="delete-message">Delete this document?</p>
        <div class="delete-actions">
          <button class="btn-confirm" (click)="confirmDelete()" [disabled]="isDeleting">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
          <button class="btn-cancel" (click)="cancelDelete()" [disabled]="isDeleting">
            Cancel
          </button>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div *ngIf="isDeleting" class="loading-overlay">
        <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    // ===== DOCUMENT CARD =====
    .document-card {
      position: relative;
      display: flex;
      flex-direction: column;
      background: white;
      border: 1px solid var(--neutral-200, #e5e7eb);
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
        border-color: rgba(0, 128, 192, 0.3);
      }

      &.deleting {
        opacity: 0.6;
        pointer-events: none;
      }
    }

    // ===== THUMBNAIL =====
    .document-thumbnail {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      background: var(--neutral-100, #f3f4f6);
      overflow: hidden;

      .thumbnail-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .thumbnail-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(0, 180, 166, 0.05), rgba(39, 199, 176, 0.05));

        .file-icon {
          font-size: 4rem;
          opacity: 0.5;
        }
      }
    }

    // ===== OVERLAY =====
    .document-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .document-card:hover .document-overlay {
      opacity: 1;
    }

    .overlay-content {
      display: flex;
      gap: 0.75rem;
    }

    .action-button {
      width: 3rem;
      height: 3rem;
      border: none;
      background: white;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        transform: scale(1.15);
      }

      &.action-preview:hover {
        background: var(--brand-teal, #00B4A6);
        box-shadow: 0 4px 12px rgba(0, 180, 166, 0.4);
      }

      &.action-download:hover {
        background: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      &.action-delete:hover {
        background: #ef4444;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      }
    }

    // ===== DOCUMENT INFO =====
    .document-info {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .document-type-badge {
      display: inline-flex;
      align-self: flex-start;
      padding: 0.25rem 0.625rem;
      background: rgba(0, 180, 166, 0.1);
      color: var(--brand-teal, #00B4A6);
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .document-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--neutral-900, #111827);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .document-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--neutral-600, #6b7280);

      .meta-separator {
        opacity: 0.5;
      }
    }

    // ===== DELETE CONFIRMATION =====
    .delete-confirmation {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem;
      background: rgba(239, 68, 68, 0.95);
      backdrop-filter: blur(8px);
      animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      .delete-message {
        color: white;
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0 0 0.75rem;
        text-align: center;
      }

      .delete-actions {
        display: flex;
        gap: 0.5rem;
      }

      .btn-confirm,
      .btn-cancel {
        flex: 1;
        padding: 0.5rem;
        border: none;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .btn-confirm {
        background: white;
        color: #dc2626;

        &:hover:not(:disabled) {
          background: #fee2e2;
        }
      }

      .btn-cancel {
        background: rgba(255, 255, 255, 0.2);
        color: white;

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
      }
      to {
        transform: translateY(0);
      }
    }

    // ===== LOADING OVERLAY =====
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 20;

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(0, 180, 166, 0.2);
        border-top-color: var(--brand-teal, #00B4A6);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    // ===== ACCESSIBILITY =====
    @media (prefers-reduced-motion: reduce) {
      .document-card,
      .document-overlay,
      .action-button,
      .delete-confirmation {
        animation: none;
        transition: none;
      }

      .spinner {
        animation: none;
      }
    }
  `]
})
export class DocumentCardComponent {
  @Input() document!: Document;
  @Output() preview = new EventEmitter<Document>();
  @Output() download = new EventEmitter<Document>();
  @Output() delete = new EventEmitter<string>();

  showDeleteConfirm = false;
  isDeleting = false;

  onPreview(): void {
    this.preview.emit(this.document);
  }

  onDownload(): void {
    this.download.emit(this.document);
  }

  startDelete(): void {
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    this.isDeleting = true;
    this.delete.emit(this.document.id);
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  getFileIcon(): string {
    const type = this.document.documentType?.toLowerCase() || '';
    const fileName = this.document.fileName?.toLowerCase() || '';

    if (type === 'receipt' || fileName.includes('receipt')) return '🧾';
    if (type === 'warranty' || fileName.includes('warranty')) return '📜';
    if (type === 'photo' || fileName.match(/\.(jpg|jpeg|png|gif)$/)) return '🖼️';
    if (type === 'manual' || fileName.includes('manual')) return '📖';
    if (fileName.match(/\.pdf$/)) return '📄';
    return '📎';
  }

  formatDocumentType(): string {
    if (!this.document.documentType) return 'Document';
    return this.document.documentType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatFileSize(): string {
    const bytes = this.document.fileSize || 0;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  }

  formatDate(): string {
    if (!this.document.uploadedAt) return '';
    try {
      const date = new Date(this.document.uploadedAt);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return '';
    }
  }
}
