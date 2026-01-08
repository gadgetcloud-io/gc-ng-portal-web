import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = environment.apiUrl;
  private timeout = environment.apiTimeout;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        timeout(this.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        timeout(this.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        timeout(this.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body: any, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .patch<T>(`${this.baseUrl}${endpoint}`, body, options)
      .pipe(
        timeout(this.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: { headers?: HttpHeaders }): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${endpoint}`, options)
      .pipe(
        timeout(this.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      // Check for FastAPI error format (detail) first, then fallback to other formats
      errorMessage = error.error?.detail || error.error?.message || error.error?.error || `Server error: ${error.status}`;

      if (environment.enableLogging) {
        console.error('API Error:', {
          status: error.status,
          message: errorMessage,
          url: error.url,
          errorBody: error.error
        });
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get authorization header with token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Check if token exists
   * Public method for auth service to check token presence
   */
  hasToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Get stored token
   * Reads from cookie (production/staging) or localStorage (local dev)
   */
  private getToken(): string | null {
    // Try cookie first (cross-subdomain support)
    const cookieToken = this.getCookie('gc_token');
    if (cookieToken) {
      return cookieToken;
    }

    // Fallback to localStorage (local development)
    return localStorage.getItem('auth_token');
  }

  /**
   * Store token
   * Stores in cookie with domain=.gadgetcloud.io for cross-subdomain access
   * Falls back to localStorage for local development
   */
  setToken(token: string): void {
    // Store in localStorage as fallback
    localStorage.setItem('auth_token', token);

    // Store in cookie for cross-subdomain access (production/staging only)
    if (environment.production || window.location.hostname.includes('gadgetcloud.io')) {
      // Set cookie with domain=.gadgetcloud.io for cross-subdomain access
      // Expires in 24 hours (same as JWT expiry)
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24);

      const domain = this.getCookieDomain();
      document.cookie = `gc_token=${token}; path=/; domain=${domain}; expires=${expiryDate.toUTCString()}; SameSite=Lax; Secure`;
    }
  }

  /**
   * Remove token
   * Clears both cookie and localStorage
   */
  removeToken(): void {
    localStorage.removeItem('auth_token');

    // Remove cookie by setting expiry to past date
    const domain = this.getCookieDomain();
    document.cookie = `gc_token=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax; Secure`;
  }

  /**
   * Get cookie value by name
   */
  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    return null;
  }

  /**
   * Get cookie domain for current environment
   * Returns .gadgetcloud.io for production/staging, null for local dev
   */
  private getCookieDomain(): string {
    const hostname = window.location.hostname;

    // For gadgetcloud.io domains (www, my, my-stg, etc.)
    if (hostname.includes('gadgetcloud.io')) {
      return '.gadgetcloud.io';
    }

    // For local development, don't set domain (defaults to current host)
    return '';
  }
}
