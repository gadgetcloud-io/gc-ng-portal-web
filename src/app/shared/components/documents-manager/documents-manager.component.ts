import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentService, GenericDocument } from '../../../core/services/document.service';
import { DocumentCardComponent } from './document-card.component';
import { DocumentUploadZoneComponent, UploadFile } from './document-upload-zone.component';

export type ParentType = 'item' | 'service_ticket' | 'user';

export interface DocumentCardModel {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  uploadedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}

@Component({
  selector: 'app-documents-manager',
  standalone: true,
  imports: [CommonModule, DocumentCardComponent, DocumentUploadZoneComponent],
  templateUrl: './documents-manager.component.html',
  styleUrl: './documents-manager.component.scss'
})
export class DocumentsManagerComponent implements OnInit, OnDestroy {
  @Input() parentType: ParentType = 'item';
  @Input() parentId: string = '';
  @Input() parentName: string = '';
  @Input() allowedDocumentTypes?: string[];

  documents: DocumentCardModel[] = [];
  filteredDocuments: DocumentCardModel[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  selectedFilter: string = 'all';
  documentTypes: { value: string; label: string }[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private documentService: DocumentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeDocumentTypes();
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDocumentTypes(): void {
    // Default types for all contexts
    const defaultTypes = [
      { value: 'all', label: 'All' },
      { value: 'receipt', label: 'Receipts' },
      { value: 'invoice', label: 'Invoices' },
      { value: 'warranty', label: 'Warranties' },
      { value: 'photo', label: 'Photos' },
      { value: 'manual', label: 'Manuals' },
      { value: 'report', label: 'Reports' },
      { value: 'contract', label: 'Contracts' },
      { value: 'id', label: 'ID Documents' },
      { value: 'other', label: 'Other' }
    ];

    if (this.allowedDocumentTypes && this.allowedDocumentTypes.length > 0) {
      // Filter to only show allowed types
      this.documentTypes = defaultTypes.filter(
        type => type.value === 'all' || this.allowedDocumentTypes!.includes(type.value)
      );
    } else {
      // Use all types
      this.documentTypes = defaultTypes;
    }
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.error = null;

    this.documentService.getDocumentsByParent(this.parentType, this.parentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (docs) => {
          this.documents = docs.map(doc => this.mapDocumentToCard(doc));
          this.applyFilter();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.message || 'Failed to load documents';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  mapDocumentToCard(doc: GenericDocument): DocumentCardModel {
    return {
      id: doc.id,
      fileName: doc.name,
      documentType: doc.type,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadDate || doc.createdAt || new Date().toISOString(),
      thumbnailUrl: doc.fileData, // For images, this will be base64
      downloadUrl: doc.fileUrl
    };
  }

  onFilesSelected(uploadFiles: UploadFile[]): void {
    if (uploadFiles.length === 0) return;

    // Upload each file sequentially
    this.uploadNextFile(uploadFiles, 0);
  }

  private uploadNextFile(files: UploadFile[], index: number): void {
    if (index >= files.length) {
      // All files uploaded, reload the list
      this.loadDocuments();
      return;
    }

    const uploadFile = files[index];

    this.documentService.createDocument({
      name: uploadFile.file.name,
      type: uploadFile.documentType,
      parentType: this.parentType,
      parentId: this.parentId,
      file: uploadFile.file,
      notes: uploadFile.notes
    }).subscribe({
      next: (result) => {
        if (result.success) {
          console.log('Document uploaded successfully:', result.document);
        } else {
          console.error('Upload failed:', result.error);
        }
        // Upload next file
        this.uploadNextFile(files, index + 1);
      },
      error: (err) => {
        console.error('Upload error:', err);
        // Continue with next file even if this one failed
        this.uploadNextFile(files, index + 1);
      }
    });
  }

  onPreview(document: DocumentCardModel): void {
    console.log('Preview document:', document);
    // TODO: Implement preview modal in Phase 4
    alert(`Preview functionality coming soon!\n\nDocument: ${document.fileName}`);
  }

  onDownload(document: DocumentCardModel): void {
    this.documentService.downloadDocument(document.id).subscribe({
      next: (result) => {
        if (result.success && result.fileData) {
          // Create download link
          const link = window.document.createElement('a');
          link.href = result.fileData;
          link.download = result.fileName || document.fileName;
          link.click();
        } else {
          alert(result.error || 'Failed to download document');
        }
      },
      error: (err) => {
        alert(err.message || 'Failed to download document');
      }
    });
  }

  onDelete(documentId: string): void {
    this.documentService.deleteDocument(documentId).subscribe({
      next: (result) => {
        if (result.success) {
          // Remove from local list
          this.documents = this.documents.filter(d => d.id !== documentId);
          this.applyFilter();
          this.cdr.detectChanges();
        } else {
          alert(result.error || 'Failed to delete document');
        }
      },
      error: (err) => {
        alert(err.message || 'Failed to delete document');
      }
    });
  }

  selectFilter(filterValue: string): void {
    this.selectedFilter = filterValue;
    this.applyFilter();
  }

  applyFilter(): void {
    if (this.selectedFilter === 'all') {
      this.filteredDocuments = [...this.documents];
    } else {
      this.filteredDocuments = this.documents.filter(
        doc => doc.documentType === this.selectedFilter
      );
    }
  }

  getFilterCount(filterValue: string): number {
    if (filterValue === 'all') {
      return this.documents.length;
    }
    return this.documents.filter(doc => doc.documentType === filterValue).length;
  }

  get hasDocuments(): boolean {
    return this.documents.length > 0;
  }

  get hasFilteredDocuments(): boolean {
    return this.filteredDocuments.length > 0;
  }

  get contextLabel(): string {
    switch (this.parentType) {
      case 'item':
        return 'Device';
      case 'service_ticket':
        return 'Ticket';
      case 'user':
        return 'Profile';
      default:
        return 'Parent';
    }
  }
}
