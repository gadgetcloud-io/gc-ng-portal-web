import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Field configuration interface matching backend FieldInfo model
 */
export interface FieldConfig {
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  allowedValues?: string[];
}

/**
 * Field update request interface matching backend FieldUpdateRequest model
 */
export interface FieldUpdateRequest {
  collection: string;      // e.g., "gc-items"
  documentId: string;      // e.g., "ITM_00001"
  field: string;           // e.g., "status", "name", "purchasePrice"
  value: any;             // New value for the field
  reason: string;         // Reason for audit log (min 10 chars, max 1000 chars)
}

/**
 * Field update response interface matching backend FieldUpdateResponse model
 */
export interface FieldUpdateResponse {
  success: boolean;
  collection: string;
  documentId: string;
  field: string;
  oldValue: any;
  newValue: any;
  updatedAt: string;
  message: string;
  auditLogId?: string;
}

/**
 * Collection info interface
 */
export interface CollectionInfo {
  resourceName: string;
  updatableFields: string[];
  protectedFields: string[];
}

/**
 * RBAC Service
 *
 * Service for role-based access control field-level updates.
 * Provides methods to fetch field configurations and update individual fields
 * with proper validation, permissions, and audit logging.
 */
@Injectable({
  providedIn: 'root'
})
export class RbacService {
  private apiUrl = `${environment.apiUrl}/rbac`;

  constructor(private http: HttpClient) {}

  /**
   * Get field configurations for a specific collection
   *
   * @param collection - Collection name (e.g., "gc-items")
   * @returns Observable of field configurations
   *
   * @example
   * this.rbacService.getFieldConfig('gc-items').subscribe(configs => {
   *   console.log(configs.status.allowedValues); // ['active', 'expiring-soon', 'expired']
   * });
   */
  getFieldConfig(collection: string): Observable<{ [field: string]: FieldConfig }> {
    const url = `${this.apiUrl}/collections/${collection}/fields`;
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<{ [field: string]: FieldConfig }>(url, { headers }).pipe(
      catchError(error => {
        console.error('Error fetching field config:', error);
        return throwError(() => new Error(error.error?.detail || 'Failed to fetch field configuration'));
      })
    );
  }

  /**
   * List all available collections and their updatable fields
   *
   * @returns Observable of collection configurations
   */
  listCollections(): Observable<{ [collection: string]: CollectionInfo }> {
    const url = `${this.apiUrl}/collections`;
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<{ [collection: string]: CollectionInfo }>(url, { headers }).pipe(
      catchError(error => {
        console.error('Error listing collections:', error);
        return throwError(() => new Error(error.error?.detail || 'Failed to list collections'));
      })
    );
  }

  /**
   * Update a single field value with RBAC validation
   *
   * @param request - Field update request
   * @returns Observable of field update response
   *
   * @example
   * this.rbacService.updateField({
   *   collection: 'gc-items',
   *   documentId: 'ITM_00001',
   *   field: 'status',
   *   value: 'active',
   *   reason: 'Warranty extended by customer service'
   * }).subscribe(response => {
   *   console.log('Updated successfully:', response.auditLogId);
   * });
   */
  updateField(request: FieldUpdateRequest): Observable<FieldUpdateResponse> {
    const url = `${this.apiUrl}/update-field`;
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<FieldUpdateResponse>(url, request, { headers }).pipe(
      catchError(error => {
        console.error('Error updating field:', error);

        // Extract error message from response
        let errorMessage = 'Failed to update field';

        if (error.status === 400) {
          errorMessage = error.error?.detail || 'Invalid field value or format';
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to edit this field';
        } else if (error.status === 404) {
          errorMessage = 'Document not found';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Validate a field value against its configuration
   *
   * @param value - Value to validate
   * @param config - Field configuration
   * @returns Validation result with error message if invalid
   */
  validateFieldValue(value: any, config: FieldConfig): { valid: boolean; error?: string } {
    // Check required
    if (config.required && (value === null || value === undefined || value === '')) {
      return { valid: false, error: 'This field is required' };
    }

    // Type-specific validation
    switch (config.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Value must be a string' };
        }
        if (config.minLength && value.length < config.minLength) {
          return { valid: false, error: `Minimum length is ${config.minLength} characters` };
        }
        if (config.maxLength && value.length > config.maxLength) {
          return { valid: false, error: `Maximum length is ${config.maxLength} characters` };
        }
        if (config.pattern) {
          const regex = new RegExp(config.pattern);
          if (!regex.test(value)) {
            return { valid: false, error: 'Invalid format' };
          }
        }
        break;

      case 'number':
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(numValue)) {
          return { valid: false, error: 'Value must be a number' };
        }
        if (config.min !== undefined && numValue < config.min) {
          return { valid: false, error: `Minimum value is ${config.min}` };
        }
        if (config.max !== undefined && numValue > config.max) {
          return { valid: false, error: `Maximum value is ${config.max}` };
        }
        break;

      case 'enum':
        if (!config.allowedValues || !config.allowedValues.includes(value)) {
          return {
            valid: false,
            error: `Value must be one of: ${config.allowedValues?.join(', ')}`
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: 'Value must be true or false' };
        }
        break;

      case 'date':
        // Validate ISO date format
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          return { valid: false, error: 'Invalid date format' };
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Format a field value for display based on its type
   *
   * @param value - Value to format
   * @param config - Field configuration
   * @returns Formatted value string
   */
  formatFieldValue(value: any, config: FieldConfig): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    switch (config.type) {
      case 'date':
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

      case 'number':
        return value.toLocaleString('en-US');

      case 'boolean':
        return value ? 'Yes' : 'No';

      case 'enum':
        // Capitalize first letter of each word
        return value
          .split('-')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

      default:
        return String(value);
    }
  }
}
