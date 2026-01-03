import { Component, EventEmitter, Input, Output, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { BulkImportService, BulkImportResult, RowValidationError, FilePreview, UploadProgress } from '../../../core/services/bulk-import.service';

type DialogStep = 'upload' | 'processing' | 'success' | 'error';

@Component({
  selector: 'gc-bulk-import-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './bulk-import-dialog.html',
  styleUrl: './bulk-import-dialog.scss'
})
export class BulkImportDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() importComplete = new EventEmitter<BulkImportResult>();

  // State
  currentStep: DialogStep = 'upload';
  selectedFile: File | null = null;
  filePreview: FilePreview | null = null;
  uploadProgress = 0;
  isUploading = false;
  isDownloadingTemplate = false;
  result: BulkImportResult | null = null;
  validationErrors: RowValidationError[] = [];
  error = '';

  // Drag and drop state
  isDragOver = false;

  constructor(
    private bulkImportService: BulkImportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetState();
    }
  }

  resetState(): void {
    this.currentStep = 'upload';
    this.selectedFile = null;
    this.filePreview = null;
    this.uploadProgress = 0;
    this.isUploading = false;
    this.isDownloadingTemplate = false;
    this.result = null;
    this.validationErrors = [];
    this.error = '';
    this.isDragOver = false;
  }

  onClose(): void {
    this.close.emit();
  }

  // File selection
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
    }
  }

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFileSelection(event.dataTransfer.files[0]);
    }
  }

  async handleFileSelection(file: File): Promise<void> {
    this.selectedFile = file;
    this.error = '';

    // Validate file
    const validation = this.bulkImportService.validateFile(file);
    if (!validation.valid) {
      this.error = validation.error || 'Invalid file';
      this.selectedFile = null;
      return;
    }

    // Generate preview for CSV files
    if (file.name.endsWith('.csv')) {
      try {
        this.filePreview = await this.bulkImportService.previewFile(file);
      } catch (error) {
        console.error('Failed to preview file:', error);
        // Don't block upload if preview fails
        this.filePreview = null;
      }
    }

    this.cdr.detectChanges();
  }

  // Template download
  async downloadTemplate(format: 'csv' | 'excel'): Promise<void> {
    this.isDownloadingTemplate = true;
    this.error = '';

    try {
      const blob = await this.bulkImportService.downloadTemplate(format).toPromise();
      if (blob) {
        const extension = format === 'excel' ? 'xlsx' : 'csv';
        this.bulkImportService.triggerDownload(blob, `gadget_import_template.${extension}`);
      }
    } catch (error: any) {
      console.error('Template download error:', error);
      this.error = 'Failed to download template. Please try again.';
    } finally {
      this.isDownloadingTemplate = false;
      this.cdr.detectChanges();
    }
  }

  // File upload
  async uploadFile(): Promise<void> {
    if (!this.selectedFile) {
      this.error = 'Please select a file to upload';
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;
    this.currentStep = 'processing';
    this.error = '';

    try {
      this.bulkImportService.uploadFile(this.selectedFile).subscribe({
        next: (event) => {
          if ('progress' in event) {
            // Upload progress event
            this.uploadProgress = (event as UploadProgress).progress;
            this.cdr.detectChanges();
          } else {
            // Final result
            this.result = event as BulkImportResult;

            if (this.result.success) {
              this.currentStep = 'success';
              this.importComplete.emit(this.result);
            } else {
              this.currentStep = 'error';
              this.validationErrors = this.result.errors || [];
              this.error = this.result.error || 'Import failed';
            }

            this.isUploading = false;
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          console.error('Upload error:', error);

          if (error.errors) {
            // Validation errors from backend
            this.result = error;
            this.validationErrors = error.errors;
            this.error = error.error || 'Validation failed';
            this.currentStep = 'error';
          } else {
            // Other errors
            this.error = error.message || 'Failed to upload file. Please try again.';
            this.currentStep = 'upload';
          }

          this.isUploading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error: any) {
      console.error('Unexpected upload error:', error);
      this.error = 'An unexpected error occurred. Please try again.';
      this.isUploading = false;
      this.currentStep = 'upload';
      this.cdr.detectChanges();
    }
  }

  // Error handling
  downloadErrorReport(): void {
    if (this.validationErrors.length > 0) {
      this.bulkImportService.downloadErrorReport(this.validationErrors);
    }
  }

  async copyErrors(): Promise<void> {
    try {
      await this.bulkImportService.copyErrorsToClipboard(this.validationErrors);
      alert('Errors copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy errors:', error);
      alert('Failed to copy errors to clipboard');
    }
  }

  // Utilities
  formatFileSize(bytes: number): string {
    return this.bulkImportService.formatFileSize(bytes);
  }

  getFileIcon(): string {
    if (!this.selectedFile) return '📄';
    return this.selectedFile.name.endsWith('.csv') ? '📊' : '📈';
  }

  getTitleForStep(): string {
    switch (this.currentStep) {
      case 'upload':
        return 'Bulk Import Gadgets';
      case 'processing':
        return 'Processing Import...';
      case 'success':
        return 'Import Complete';
      case 'error':
        return 'Import Failed';
      default:
        return 'Bulk Import';
    }
  }

  canUpload(): boolean {
    return !!this.selectedFile && !this.isUploading;
  }

  resetAndUploadAgain(): void {
    this.selectedFile = null;
    this.filePreview = null;
    this.currentStep = 'upload';
    this.validationErrors = [];
    this.error = '';
  }
}
