import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DocumentService, GenericDocument } from '../../../core/services/document.service';

@Component({
  selector: 'gc-view-documents-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './view-documents-dialog.html',
  styleUrl: './view-documents-dialog.scss'
})
export class ViewDocumentsDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() deviceId?: string;
  @Input() deviceName?: string;
  @Output() close = new EventEmitter<void>();
  @Output() deleteDocument = new EventEmitter<GenericDocument>();
  @Output() uploadNew = new EventEmitter<void>();

  documents: GenericDocument[] = [];
  isLoading = true;
  error = '';

  constructor(public documentService: DocumentService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen && this.deviceId) {
      this.loadDocuments();
    }
  }

  loadDocuments(): void {
    if (!this.deviceId) {
      this.documents = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.documentService.getDocumentsByDevice(this.deviceId).subscribe({
      next: (docs) => {
        this.documents = docs.sort((a, b) => {
          // Sort by upload date, newest first
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.error = 'Failed to load documents';
        this.isLoading = false;
      }
    });
  }

  onDownload(doc: GenericDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (result) => {
        if (result.success && result.fileData) {
          // Create a download link
          const link = document.createElement('a');
          link.href = result.fileData;
          link.download = result.fileName || doc.name;
          link.click();
        } else {
          alert('Failed to download document: ' + (result.error || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('Download error:', error);
        alert('Failed to download document');
      }
    });
  }

  onDelete(doc: GenericDocument): void {
    this.deleteDocument.emit(doc);
  }

  onUploadNew(): void {
    this.uploadNew.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  }
}
