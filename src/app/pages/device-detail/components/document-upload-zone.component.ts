import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PdfConverterService, ConversionProgress } from '../../../core/services/pdf-converter.service';

export interface UploadFile {
  file: File;
  progress: number;
  error?: string;
  documentType: string;
  notes: string;
  isConverting?: boolean;
  conversionMessage?: string;
  originalFileName?: string; // For PDF conversions
}

@Component({
  selector: 'app-document-upload-zone',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-upload-zone.component.html',
  styleUrl: './document-upload-zone.component.scss'
})
export class DocumentUploadZoneComponent {
  @Input() deviceId: string = '';
  @Output() filesSelected = new EventEmitter<UploadFile[]>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isDragging = false;
  selectedFiles: UploadFile[] = [];
  defaultDocumentType = 'other';
  notes = '';
  isProcessingPdf = false;

  constructor(private pdfConverter: PdfConverterService) {}

  // File validation
  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  readonly ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  readonly ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

  documentTypes = [
    { value: 'receipt', label: 'Receipt' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'warranty', label: 'Warranty' },
    { value: 'photo', label: 'Photo' },
    { value: 'manual', label: 'Manual' },
    { value: 'report', label: 'Report' },
    { value: 'contract', label: 'Contract' },
    { value: 'id', label: 'ID Document' },
    { value: 'other', label: 'Other' }
  ];

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  openFilePicker(): void {
    this.fileInput.nativeElement.click();
  }

  async handleFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const validation = this.validateFile(file);

      if (!validation.valid) {
        // Show error for invalid file
        this.selectedFiles.push({
          file,
          progress: 0,
          error: validation.error,
          documentType: this.defaultDocumentType,
          notes: this.notes
        });
        continue;
      }

      // Check if file is PDF
      if (this.pdfConverter.isPdfFile(file)) {
        await this.handlePdfConversion(file);
      } else {
        // Regular image file
        this.selectedFiles.push({
          file,
          progress: 0,
          documentType: this.defaultDocumentType,
          notes: this.notes
        });
      }
    }
  }

  private async handlePdfConversion(pdfFile: File): Promise<void> {
    // Create a placeholder entry to show conversion progress
    const placeholderIndex = this.selectedFiles.length;
    this.selectedFiles.push({
      file: pdfFile,
      progress: 0,
      documentType: this.defaultDocumentType,
      notes: this.notes,
      isConverting: true,
      conversionMessage: 'Preparing to convert PDF...',
      originalFileName: pdfFile.name
    });

    this.isProcessingPdf = true;

    try {
      // Convert PDF to images
      const convertedImages = await this.pdfConverter.convertPdfToImages(
        pdfFile,
        {
          scale: 2.0,
          quality: 0.85,
          imageFormat: 'image/jpeg',
          maxPages: 10
        },
        (progress: ConversionProgress) => {
          // Update progress message
          if (this.selectedFiles[placeholderIndex]) {
            this.selectedFiles[placeholderIndex].conversionMessage = progress.message;
          }
        }
      );

      // Remove the placeholder
      this.selectedFiles.splice(placeholderIndex, 1);

      // Add all converted images
      for (const convertedImage of convertedImages) {
        this.selectedFiles.push({
          file: convertedImage.file,
          progress: 0,
          documentType: 'photo', // Converted PDFs are photos
          notes: this.notes,
          originalFileName: pdfFile.name
        });
      }

    } catch (error) {
      console.error('PDF conversion failed:', error);

      // Update placeholder to show error
      if (this.selectedFiles[placeholderIndex]) {
        this.selectedFiles[placeholderIndex].isConverting = false;
        this.selectedFiles[placeholderIndex].error =
          error instanceof Error ? error.message : 'Failed to convert PDF. Please try again.';
      }
    } finally {
      this.isProcessingPdf = false;
    }
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds 10MB limit (${this.formatFileSize(file.size)})`
      };
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.ALLOWED_TYPES.includes(file.type) && !this.ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: 'Only PDF, PNG, and JPG files are allowed'
      };
    }

    return { valid: true };
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  get validFilesCount(): number {
    return this.selectedFiles.filter(f => !f.error).length;
  }

  uploadFiles(): void {
    const validFiles = this.selectedFiles.filter(f => !f.error);
    if (validFiles.length === 0) return;

    this.filesSelected.emit(validFiles);
    this.selectedFiles = [];
    this.notes = '';

    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  clearAll(): void {
    this.selectedFiles = [];
    this.notes = '';

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 10) / 10 + ' ' + sizes[i];
  }

  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return '🖼️';
    return '📎';
  }

  get hasValidFiles(): boolean {
    return this.selectedFiles.some(f => !f.error);
  }

  get totalSize(): number {
    return this.selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
  }
}
