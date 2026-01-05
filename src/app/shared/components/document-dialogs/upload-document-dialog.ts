import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DocumentService, GenericDocumentCreateRequest } from '../../../core/services/document.service';
import { DeviceService, Device } from '../../../core/services/device.service';

@Component({
  selector: 'gc-upload-document-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './upload-document-dialog.html',
  styleUrl: './upload-document-dialog.scss'
})
export class UploadDocumentDialogComponent implements OnInit {
  @Input() isOpen = false;
  @Input() preselectedDeviceId?: string; // Optional: preselect a device
  @Output() close = new EventEmitter<void>();
  @Output() documentUploaded = new EventEmitter<void>();

  document: {
    name: string;
    type: 'receipt' | 'warranty' | 'manual' | 'invoice' | 'photo' | 'other';
    deviceId: string;
    file: File | null;
    notes: string;
  } = {
    name: '',
    type: 'receipt',
    deviceId: '',
    file: null,
    notes: ''
  };

  documentTypes = [
    { value: 'receipt', label: 'Receipt', icon: '🧾' },
    { value: 'warranty', label: 'Warranty Document', icon: '🛡️' },
    { value: 'manual', label: 'User Manual', icon: '📖' },
    { value: 'invoice', label: 'Invoice', icon: '💵' },
    { value: 'photo', label: 'Photo', icon: '📷' },
    { value: 'other', label: 'Other', icon: '📄' }
  ];

  devices: Device[] = [];
  selectedFileName = '';
  fileSize = '';
  isUploading = false;
  error = '';

  // Accepted file types
  acceptedFileTypes = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt';
  maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(
    private documentService: DocumentService,
    private deviceService: DeviceService
  ) {}

  ngOnInit(): void {
    // Load devices for the dropdown
    this.deviceService.devices$.subscribe({
      next: (devices) => {
        this.devices = devices;

        // If a device is preselected, set it
        if (this.preselectedDeviceId) {
          this.document.deviceId = this.preselectedDeviceId;
        }
      },
      error: (error) => {
        console.error('Error loading devices:', error);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size
      if (file.size > this.maxFileSize) {
        this.error = 'File size exceeds 10MB limit';
        this.document.file = null;
        this.selectedFileName = '';
        this.fileSize = '';
        return;
      }

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        this.error = 'Invalid file type. Please upload PDF, image, or document files.';
        this.document.file = null;
        this.selectedFileName = '';
        this.fileSize = '';
        return;
      }

      this.error = '';
      this.document.file = file;
      this.selectedFileName = file.name;
      this.fileSize = this.documentService.formatFileSize(file.size);

      // Auto-fill document name if empty
      if (!this.document.name) {
        this.document.name = file.name;
      }
    }
  }

  onSubmit(): void {
    // Validation
    if (!this.document.name || !this.document.type || !this.document.deviceId || !this.document.file) {
      this.error = 'Please fill in all required fields and select a file';
      return;
    }

    this.isUploading = true;
    this.error = '';

    const request: GenericDocumentCreateRequest = {
      name: this.document.name,
      type: this.document.type,
      parentType: 'item',
      parentId: this.document.deviceId,
      file: this.document.file,
      notes: this.document.notes
    };

    this.documentService.createDocument(request).subscribe({
      next: (result) => {
        this.isUploading = false;

        if (result.success) {
          console.log('Document uploaded successfully:', result.document);
          this.documentUploaded.emit();
          this.resetForm();
          this.close.emit();
        } else {
          this.error = result.error || 'Failed to upload document';
        }
      },
      error: (error) => {
        this.isUploading = false;
        this.error = 'An error occurred while uploading the document';
        console.error('Upload error:', error);
      }
    });
  }

  resetForm(): void {
    this.document = {
      name: '',
      type: 'receipt',
      deviceId: this.preselectedDeviceId || '',
      file: null,
      notes: ''
    };
    this.selectedFileName = '';
    this.fileSize = '';
    this.error = '';
    this.isUploading = false;

    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onClose(): void {
    if (!this.isUploading) {
      this.resetForm();
      this.close.emit();
    }
  }

  getDeviceName(deviceId: string): string {
    const device = this.devices.find(d => d.id === deviceId);
    return device ? device.name : 'Unknown Device';
  }
}
