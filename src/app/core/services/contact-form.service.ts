import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ServiceTicketResponse {
  id: string;
  formType: string;
  status: string;
  userId?: string | null;
  emailSent: boolean;
  createdAt: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactFormService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Submit contact form as a support request
   * This endpoint works without authentication (requireAuth: false in support.yaml)
   */
  submitContactForm(formData: ContactFormData): Observable<ServiceTicketResponse> {
    const requestBody = {
      formType: 'support_request',
      data: {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        description: formData.message,
        category: 'other', // Default category for general contact
        priority: 'normal' // Default priority for contact forms
      }
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // No authentication needed - support_request has requireAuth: false
    return this.http.post<ServiceTicketResponse>(
      `${this.apiUrl}/service-tickets/support_request/submit`,
      requestBody,
      { headers }
    );
  }
}
