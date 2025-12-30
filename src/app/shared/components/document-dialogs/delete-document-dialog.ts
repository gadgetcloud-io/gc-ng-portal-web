import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DocumentService, Document } from '../../../core/services/document.service';

@Component({
  selector: 'gc-delete-document-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './delete-document-dialog.html',
  styleUrl: './delete-document-dialog.scss'
})
export class DeleteDocumentDialogComponent {
  @Input() isOpen = false;
  @Input() document: Document | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() documentDeleted = new EventEmitter<void>();

  isDeleting = false;
  error = '';

  constructor(public documentService: DocumentService) {}

  onConfirmDelete(): void {
    if (!this.document?.id) {
      return;
    }

    this.isDeleting = true;
    this.error = '';

    this.documentService.deleteDocument(this.document.id).subscribe({
      next: (result) => {
        this.isDeleting = false;

        if (result.success) {
          console.log('Document deleted successfully');
          this.documentDeleted.emit();
          this.close.emit();
        } else {
          this.error = result.error || 'Failed to delete document';
        }
      },
      error: (error) => {
        this.isDeleting = false;
        this.error = 'An error occurred while deleting the document';
        console.error('Delete error:', error);
      }
    });
  }

  onClose(): void {
    if (!this.isDeleting) {
      this.error = '';
      this.close.emit();
    }
  }
}
