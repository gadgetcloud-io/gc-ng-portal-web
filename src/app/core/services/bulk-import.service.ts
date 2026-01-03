import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BulkImportResult {
  success: boolean;
  error?: string;
  summary: {
    totalRows: number;
    processedRows: number;
    createdItems: number;
    failedRows: number;
  };
  createdItemIds?: string[];
  errors?: RowValidationError[];
  processingTimeMs?: number;
}

export interface RowValidationError {
  row: number;
  column: string;
  value: any;
  error: string;
}

export interface FilePreview {
  fileName: string;
  fileSize: number;
  rowCount: number;
  columns: string[];
  preview: any[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadProgress {
  progress: number;
  loaded: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class BulkImportService {
  private readonly apiUrl = `${environment.apiUrl}/items`;
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedExtensions = ['.csv', '.xlsx'];
  private readonly allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  constructor(private http: HttpClient) {}

  /**
   * Upload file for bulk import
   */
  uploadFile(file: File): Observable<BulkImportResult | UploadProgress> {
    // Validate file before upload
    const validation = this.validateFile(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<BulkImportResult>(`${this.apiUrl}/bulk-import`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<BulkImportResult>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            if (event.total) {
              const progress = Math.round(100 * event.loaded / event.total);
              return {
                progress,
                loaded: event.loaded,
                total: event.total
              } as UploadProgress;
            }
            return { progress: 0, loaded: 0, total: 0 } as UploadProgress;

          case HttpEventType.Response:
            return event.body as BulkImportResult;

          default:
            return { progress: 0, loaded: 0, total: 0 } as UploadProgress;
        }
      }),
      catchError((error) => {
        console.error('Bulk import error:', error);

        // Handle backend validation errors
        if (error.error && error.error.errors) {
          return throwError(() => ({
            success: false,
            error: error.error.error || 'Import failed',
            summary: error.error.summary || {
              totalRows: 0,
              processedRows: 0,
              createdItems: 0,
              failedRows: 0
            },
            errors: error.error.errors || []
          }));
        }

        return throwError(() => new Error(error.error?.detail || 'Failed to upload file'));
      })
    );
  }

  /**
   * Download import template
   */
  downloadTemplate(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/export/template`, {
      params: { format },
      responseType: 'blob'
    }).pipe(
      catchError((error) => {
        console.error('Template download error:', error);
        return throwError(() => new Error('Failed to download template'));
      })
    );
  }

  /**
   * Trigger browser download for blob
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Validate file format and size
   */
  validateFile(file: File): FileValidationResult {
    // Check if file exists
    if (!file) {
      return { valid: false, error: 'Please select a file' };
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = this.allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return {
        valid: false,
        error: 'Invalid file format. Only CSV and Excel (.xlsx) files are supported.'
      };
    }

    // Check MIME type
    const hasValidMimeType = this.allowedMimeTypes.includes(file.type);
    if (!hasValidMimeType && file.type !== '') {
      // Some browsers don't set MIME type for CSV, so we allow empty type if extension is valid
      return {
        valid: false,
        error: 'Invalid file type. Only CSV and Excel (.xlsx) files are supported.'
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      const maxSizeMB = this.maxFileSize / (1024 * 1024);
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit. Please reduce file size.`
      };
    }

    // Check if file is empty
    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty. Please upload a file with at least one row of data.'
      };
    }

    return { valid: true };
  }

  /**
   * Preview CSV file contents (client-side parsing)
   * Note: This is a simple preview - full validation happens on the server
   */
  async previewFile(file: File): Promise<FilePreview> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const content = e.target?.result as string;

          if (file.name.endsWith('.csv')) {
            const lines = content.split('\n').filter(line => line.trim());
            const columns = lines[0]?.split(',').map(col => col.trim()) || [];
            const preview = lines.slice(1, 6).map(line => {
              const values = line.split(',');
              const row: any = {};
              columns.forEach((col, index) => {
                row[col] = values[index]?.trim() || '';
              });
              return row;
            });

            resolve({
              fileName: file.name,
              fileSize: file.size,
              rowCount: lines.length - 1, // Exclude header
              columns,
              preview
            });
          } else {
            // For Excel files, we can't easily parse client-side without a library
            // Just return basic info
            resolve({
              fileName: file.name,
              fileSize: file.size,
              rowCount: 0, // Unknown until server processes
              columns: [],
              preview: []
            });
          }
        } catch (error) {
          reject(new Error('Failed to preview file'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate error report CSV
   */
  generateErrorReportCsv(errors: RowValidationError[]): string {
    const header = 'Row,Column,Value,Error\n';
    const rows = errors.map(error =>
      `${error.row},"${error.column}","${error.value}","${error.error}"`
    ).join('\n');

    return header + rows;
  }

  /**
   * Download error report
   */
  downloadErrorReport(errors: RowValidationError[]): void {
    const csv = this.generateErrorReportCsv(errors);
    const blob = new Blob([csv], { type: 'text/csv' });
    const timestamp = new Date().toISOString().split('T')[0];
    this.triggerDownload(blob, `import_errors_${timestamp}.csv`);
  }

  /**
   * Copy errors to clipboard
   */
  async copyErrorsToClipboard(errors: RowValidationError[]): Promise<void> {
    const errorText = errors.map(error =>
      `Row ${error.row}: ${error.column} - ${error.error}`
    ).join('\n');

    try {
      await navigator.clipboard.writeText(errorText);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy errors to clipboard');
    }
  }
}
