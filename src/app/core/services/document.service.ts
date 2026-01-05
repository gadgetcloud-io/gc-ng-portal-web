import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { ApiService, ApiResponse } from './api.service';

export interface Document {
  id: string;
  name: string;
  type: 'receipt' | 'warranty' | 'manual' | 'invoice' | 'photo' | 'other';
  deviceId: string;
  deviceName?: string; // For display purposes
  fileSize: number; // in bytes
  fileType: string; // MIME type (e.g., 'application/pdf', 'image/png')
  uploadDate: string; // ISO date string
  fileData?: string; // Base64 encoded file data (for mock mode)
  fileUrl?: string; // URL to file (for API mode)
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentCreateRequest {
  name: string;
  type: 'receipt' | 'warranty' | 'manual' | 'invoice' | 'photo' | 'other';
  deviceId: string;
  file: File;
  notes?: string;
}

export interface DocumentUpdateRequest {
  id: string;
  name?: string;
  type?: 'receipt' | 'warranty' | 'manual' | 'invoice' | 'photo' | 'other';
  notes?: string;
}

// ===== GENERIC INTERFACES (Decoupled from devices) =====
export type ParentType = 'item' | 'service_ticket' | 'user';

export interface GenericDocument {
  id: string;
  name: string;
  type: string;
  parentType: ParentType;
  parentId: string;
  parentName?: string; // For display purposes
  fileSize: number; // in bytes
  fileType: string; // MIME type (e.g., 'application/pdf', 'image/png')
  uploadDate: string; // ISO date string
  fileData?: string; // Base64 encoded file data (for mock mode)
  fileUrl?: string; // URL to file (for API mode)
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GenericDocumentCreateRequest {
  name: string;
  type: string;
  parentType: ParentType;
  parentId: string;
  file: File;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private documents = new BehaviorSubject<GenericDocument[]>([]);
  public documents$ = this.documents.asObservable();

  // Toggle between mock (localStorage) and real API
  private useApi = true; // API mode enabled
  private readonly STORAGE_KEY = 'gc_documents';

  constructor(private apiService: ApiService) {
    this.loadDocuments();
  }

  /**
   * Load documents from localStorage (mock mode) or API
   */
  private loadDocuments(): void {
    if (this.useApi) {
      // API mode: Load all documents from backend
      this.apiService.get<ApiResponse<GenericDocument[]>>('/documents').pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error loading documents from API:', error);
          return of([]);
        })
      ).subscribe(docs => {
        this.documents.next(docs);
      });
    } else {
      // Load from localStorage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          const docs = JSON.parse(stored);
          this.documents.next(docs);
        } catch (error) {
          console.error('Error loading documents from localStorage:', error);
          this.documents.next([]);
        }
      } else {
        // Initialize with empty array
        this.documents.next([]);
      }
    }
  }

  /**
   * Save documents to localStorage
   */
  private saveToLocalStorage(docs: GenericDocument[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(docs));
    } catch (error) {
      console.error('Error saving documents to localStorage:', error);
      throw new Error('Failed to save documents');
    }
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate a unique ID for documents
   */
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a new document (Generic version - supports all parent types)
   */
  createDocument(request: GenericDocumentCreateRequest): Observable<{
    success: boolean;
    document?: GenericDocument;
    error?: string;
  }> {
    if (this.useApi) {
      // API mode: Upload file using FormData
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('parentType', request.parentType);
      formData.append('parentId', request.parentId);
      formData.append('documentType', request.type);
      if (request.notes) {
        formData.append('notes', request.notes);
      }

      return this.apiService.post<GenericDocument>('/documents/upload', formData).pipe(
        map((doc: any) => {
          // API returns document directly (not wrapped in ApiResponse)
          if (doc && doc.id) {
            return { success: true, document: doc as GenericDocument };
          }
          return { success: false, error: 'Failed to upload document' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Failed to upload document' });
        })
      );
    }

    // Mock implementation with localStorage
    return new Observable(observer => {
      // Validate file size (max 10MB for mock mode)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (request.file.size > maxSize) {
        observer.next({
          success: false,
          error: 'File size exceeds 10MB limit'
        });
        observer.complete();
        return;
      }

      // Convert file to base64
      this.fileToBase64(request.file).then(fileData => {
        const now = new Date().toISOString();
        const newDocument: GenericDocument = {
          id: this.generateId(),
          name: request.name,
          type: request.type,
          parentType: request.parentType,
          parentId: request.parentId,
          fileSize: request.file.size,
          fileType: request.file.type,
          uploadDate: now,
          fileData: fileData,
          notes: request.notes,
          createdAt: now,
          updatedAt: now
        };

        const currentDocs = this.documents.value;
        const updatedDocs = [...currentDocs, newDocument];

        try {
          this.saveToLocalStorage(updatedDocs);
          this.documents.next(updatedDocs);

          // Simulate network delay
          setTimeout(() => {
            observer.next({ success: true, document: newDocument });
            observer.complete();
          }, 800);
        } catch (error) {
          observer.next({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to save document'
          });
          observer.complete();
        }
      }).catch(error => {
        observer.next({
          success: false,
          error: 'Failed to read file'
        });
        observer.complete();
      });
    });
  }

  /**
   * Get all documents
   */
  getDocuments(): Observable<GenericDocument[]> {
    return this.documents$;
  }

  /**
   * Get documents for a specific device (legacy - use getDocumentsByParent instead)
   */
  getDocumentsByDevice(deviceId: string): Observable<GenericDocument[]> {
    return this.documents$.pipe(
      map(docs => docs.filter(doc => doc.parentType === 'item' && doc.parentId === deviceId))
    );
  }

  /**
   * Get documents by parent type and ID (from API) - Returns generic documents
   */
  getDocumentsByParent(parentType: string, parentId: string): Observable<GenericDocument[]> {
    if (this.useApi) {
      // Fetch from API with parent filters (trailing slash required)
      return this.apiService.get<GenericDocument[]>(`/documents/?parent_type=${parentType}&parent_id=${parentId}`).pipe(
        map((docs: any) => {
          // Handle both direct array and wrapped response
          const documents = Array.isArray(docs) ? docs : (docs.data || []);
          return documents as GenericDocument[];
        }),
        catchError(error => {
          console.error('Error fetching documents by parent:', error);
          return of([]);
        })
      );
    } else {
      // Fallback to local filtering (for mock mode)
      return this.documents$.pipe(
        map(docs => docs.filter(doc => doc.parentType === parentType && doc.parentId === parentId))
      );
    }
  }

  /**
   * Get a single document by ID
   */
  getDocumentById(id: string): Observable<GenericDocument | undefined> {
    return this.documents$.pipe(
      map(docs => docs.find(doc => doc.id === id))
    );
  }

  /**
   * Update a document (metadata only, not the file itself)
   */
  updateDocument(update: DocumentUpdateRequest): Observable<{
    success: boolean;
    document?: GenericDocument;
    error?: string;
  }> {
    if (this.useApi) {
      // API mode: Update document metadata via backend
      const { id, ...updateData } = update;
      return this.apiService.put<ApiResponse<GenericDocument>>(`/documents/${id}`, updateData).pipe(
        map(response => {
          if (response.success && response.data) {
            // Update local state
            const currentDocs = this.documents.value;
            const index = currentDocs.findIndex(doc => doc.id === id);
            if (index !== -1) {
              currentDocs[index] = response.data;
              this.documents.next([...currentDocs]);
            }
            return { success: true, document: response.data };
          }
          return { success: false, error: response.error || 'Failed to update document' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Failed to update document' });
        })
      );
    }

    // Mock implementation
    return of(null).pipe(
      delay(600),
      map(() => {
        const currentDocs = this.documents.value;
        const index = currentDocs.findIndex(doc => doc.id === update.id);

        if (index === -1) {
          return { success: false, error: 'Document not found' };
        }

        const updatedDocument: GenericDocument = {
          ...currentDocs[index],
          ...(update.name && { name: update.name }),
          ...(update.type && { type: update.type }),
          ...(update.notes !== undefined && { notes: update.notes }),
          updatedAt: new Date().toISOString()
        };

        const updatedDocs = [...currentDocs];
        updatedDocs[index] = updatedDocument;

        this.saveToLocalStorage(updatedDocs);
        this.documents.next(updatedDocs);

        return { success: true, document: updatedDocument };
      }),
      catchError(error => {
        return of({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update document'
        });
      })
    );
  }

  /**
   * Delete a document
   */
  deleteDocument(id: string): Observable<{
    success: boolean;
    error?: string;
  }> {
    if (this.useApi) {
      // API mode: Delete document via backend
      return this.apiService.delete<ApiResponse<void>>(`/documents/${id}`).pipe(
        map(response => {
          if (response.success) {
            // Update local state
            const currentDocs = this.documents.value;
            this.documents.next(currentDocs.filter(doc => doc.id !== id));
            return { success: true };
          }
          return { success: false, error: response.error || 'Failed to delete document' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Failed to delete document' });
        })
      );
    }

    // Mock implementation
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentDocs = this.documents.value;
        const filteredDocs = currentDocs.filter(doc => doc.id !== id);

        if (filteredDocs.length === currentDocs.length) {
          return { success: false, error: 'Document not found' };
        }

        this.saveToLocalStorage(filteredDocs);
        this.documents.next(filteredDocs);

        return { success: true };
      }),
      catchError(error => {
        return of({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete document'
        });
      })
    );
  }

  /**
   * Download a document (returns the file data or URL)
   */
  downloadDocument(id: string): Observable<{
    success: boolean;
    fileData?: string;
    fileName?: string;
    fileType?: string;
    error?: string;
  }> {
    if (this.useApi) {
      // API mode: Get signed download URL from backend
      return this.apiService.get<ApiResponse<{ url: string; fileName: string }>>(`/documents/${id}/download`).pipe(
        map(response => {
          if (response.success && response.data) {
            // Return the signed URL - the browser will download from this URL
            return {
              success: true,
              fileData: response.data.url,
              fileName: response.data.fileName
            };
          }
          return { success: false, error: response.error || 'Failed to get download URL' };
        }),
        catchError(error => {
          return of({ success: false, error: error.message || 'Failed to download document' });
        })
      );
    }

    // Mock implementation - return base64 data
    return this.getDocumentById(id).pipe(
      map(document => {
        if (!document) {
          return { success: false, error: 'Document not found' };
        }

        if (!document.fileData) {
          return { success: false, error: 'File data not available' };
        }

        return {
          success: true,
          fileData: document.fileData,
          fileName: document.name,
          fileType: document.fileType
        };
      })
    );
  }

  /**
   * Get document statistics
   */
  getDocumentStats(): Observable<{
    total: number;
    byType: Record<string, number>;
    totalSize: number;
  }> {
    return this.documents$.pipe(
      map(docs => {
        const stats = {
          total: docs.length,
          byType: {} as Record<string, number>,
          totalSize: 0
        };

        docs.forEach(doc => {
          // Count by type
          stats.byType[doc.type] = (stats.byType[doc.type] || 0) + 1;
          // Sum file sizes
          stats.totalSize += doc.fileSize;
        });

        return stats;
      })
    );
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get icon for document type
   */
  getDocumentTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      receipt: '🧾',
      warranty: '🛡️',
      manual: '📖',
      invoice: '💵',
      photo: '📷',
      other: '📄'
    };
    return icons[type] || '📄';
  }

  /**
   * Get label for document type
   */
  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      receipt: 'Receipt',
      warranty: 'Warranty',
      manual: 'Manual',
      invoice: 'Invoice',
      photo: 'Photo',
      other: 'Other'
    };
    return labels[type] || 'Document';
  }
}
