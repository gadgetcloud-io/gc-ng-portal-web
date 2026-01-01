import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentService, Document } from '../../../core/services/document.service';
import { DocumentCardComponent, Document as CardDocument } from '../components/document-card.component';
import { DocumentUploadZoneComponent, UploadFile } from '../components/document-upload-zone.component';

@Component({
  selector: 'app-documents-tab',
  standalone: true,
  imports: [CommonModule, DocumentCardComponent, DocumentUploadZoneComponent],
  templateUrl: './documents-tab.component.html',
  styleUrl: './documents-tab.component.scss'
})
export class DocumentsTabComponent implements OnInit, OnDestroy {
  @Input() deviceId: string = '';
  @Input() deviceName: string = '';

  documents: CardDocument[] = [];
  filteredDocuments: CardDocument[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  selectedFilter: string = 'all';
  documentTypes = [
    { value: 'all', label: 'All' },
    { value: 'receipt', label: 'Receipts' },
    { value: 'warranty', label: 'Warranties' },
    { value: 'photo', label: 'Photos' },
    { value: 'manual', label: 'Manuals' },
    { value: 'other', label: 'Other' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private documentService: DocumentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDocuments(): void {
    this.isLoading = true;
    this.error = null;

    this.documentService.getDocumentsByParent('item', this.deviceId)
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

  mapDocumentToCard(doc: Document): CardDocument {
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
      type: uploadFile.documentType as any,
      deviceId: this.deviceId,
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

  onPreview(document: CardDocument): void {
    console.log('Preview document:', document);
    // TODO: Implement preview modal in Phase 4
    alert(`Preview functionality coming soon!\n\nDocument: ${document.fileName}`);
  }

  onDownload(document: CardDocument): void {
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
}
