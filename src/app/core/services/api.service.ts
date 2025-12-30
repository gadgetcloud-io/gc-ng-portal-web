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
      errorMessage = error.error?.message || error.error?.error || `Server error: ${error.status}`;

      if (environment.enableLogging) {
        console.error('API Error:', {
          status: error.status,
          message: errorMessage,
          url: error.url
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
   * Get stored token
   */
  private getToken(): string | null {
    return localStorage.getItem('gc_token');
  }

  /**
   * Store token
   */
  setToken(token: string): void {
    localStorage.setItem('gc_token', token);
  }

  /**
   * Remove token
   */
  removeToken(): void {
    localStorage.removeItem('gc_token');
  }
}
