import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { DeviceService, Device } from '../../../core/services/device.service';
import { DocumentService, GenericDocument } from '../../../core/services/document.service';

@Component({
  selector: 'gc-edit-device-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './edit-device-dialog.html',
  styleUrl: './edit-device-dialog.scss'
})
export class EditDeviceDialogComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() device: Device | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() deviceUpdated = new EventEmitter<void>();

  editedDevice: Device = this.getEmptyDevice();

  categories: Array<{value: string; label: string; emoji: string}> = [];

  isSubmitting = false;
  error = '';
  currentTab: 'basic' | 'purchase' | 'notes' | 'documents' = 'basic';

  // Document management
  documents: GenericDocument[] = [];
  documentsLoading = false;
  uploadProgress = 0;

  constructor(
    private deviceService: DeviceService,
    private documentService: DocumentService
  ) {
    // Load categories from backend
    this.loadCategories();
  }

  private loadCategories(): void {
    this.deviceService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories in edit dialog:', error);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['device'] && this.device) {
      // Clone the device to avoid mutating the original
      this.editedDevice = { ...this.device };
    }
  }

  onSubmit(): void {
    if (!this.editedDevice.id) {
      this.error = 'Device ID is missing';
      return;
    }

    // Validate required fields
    if (!this.editedDevice.name || !this.editedDevice.category ||
        !this.editedDevice.purchaseDate || !this.editedDevice.warrantyExpires) {
      this.error = 'Please fill in all required fields';
      return;
    }

    // Validate dates
    if (new Date(this.editedDevice.warrantyExpires) < new Date(this.editedDevice.purchaseDate)) {
      this.error = 'Warranty expiration must be after purchase date';
      return;
    }

    this.isSubmitting = true;
    this.error = '';

    this.deviceService.updateDevice(this.editedDevice).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        if (result.success) {
          this.deviceUpdated.emit();
          this.close.emit();
        } else {
          this.error = result.error || 'Failed to update device';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = 'An error occurred while updating the device';
        console.error('Error updating device:', err);
      }
    });
  }

  onClose(): void {
    this.error = '';
    this.isSubmitting = false;
    this.currentTab = 'basic'; // Reset to first tab
    this.close.emit();
  }

  private getEmptyDevice(): Device {
    return {
      id: '',
      name: '',
      category: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      purchasePrice: undefined,
      warrantyExpires: '',
      warrantyProvider: '',
      status: 'active',
      image: '',
      notes: ''
    };
  }

  // Document Management Methods
  loadDocuments(): void {
    if (!this.editedDevice.id) return;

    this.documentsLoading = true;

    // Fetch documents directly from API with parent type and ID
    this.documentService.getDocumentsByParent('item', this.editedDevice.id).subscribe({
      next: (docs) => {
        this.documents = docs.sort((a, b) =>
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
        this.documentsLoading = false;
      },
      error: (error) => {
        console.error('Error loading documents:', error);
        this.documentsLoading = false;
        // Fallback to deviceId-based filter
        this.documentService.getDocumentsByDevice(this.editedDevice.id).subscribe({
          next: (docs) => {
            this.documents = docs;
            this.documentsLoading = false;
          },
          error: () => {
            this.documentsLoading = false;
          }
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    this.uploadFiles(files);
    input.value = ''; // Reset input
  }

  uploadFiles(files: File[]): void {
    if (!this.editedDevice.id) {
      alert('Please save the device first before uploading documents');
      return;
    }

    files.forEach(file => {
      this.uploadProgress = 10;

      this.documentService.createDocument({
        name: file.name,
        type: 'other',
        parentType: 'item',
        parentId: this.editedDevice.id,
        file
      }).subscribe({
        next: (result: any) => {
          this.uploadProgress = 100;
          if (result.success) {
            this.loadDocuments(); // Reload list
            setTimeout(() => this.uploadProgress = 0, 1000);
          } else {
            alert('Upload failed: ' + (result.error || 'Unknown error'));
            this.uploadProgress = 0;
          }
        },
        error: (error: any) => {
          console.error('Upload error:', error);
          alert('Upload failed: ' + error.message);
          this.uploadProgress = 0;
        }
      });
    });
  }

  downloadDocument(doc: GenericDocument): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (result) => {
        if (result.success && result.fileData) {
          const link = document.createElement('a');
          link.href = result.fileData;
          link.download = result.fileName || doc.name;
          link.click();
        } else {
          alert('Download failed: ' + (result.error || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('Download error:', error);
        alert('Download failed');
      }
    });
  }

  deleteDocument(doc: GenericDocument): void {
    if (!confirm(`Delete "${doc.name}"?`)) return;

    this.documentService.deleteDocument(doc.id).subscribe({
      next: (result) => {
        if (result.success) {
          this.loadDocuments(); // Reload list
        } else {
          alert('Delete failed: ' + (result.error || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('Delete error:', error);
        alert('Delete failed');
      }
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
