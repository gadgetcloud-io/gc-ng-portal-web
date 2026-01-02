import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SupportRequestData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface FeedbackData {
  name: string;
  email: string;
  category: string;
  message: string;
}

export interface ServiceTicketResponse {
  id: string;
  formType: string;
  status: string;
  userId?: string;
  emailSent: boolean;
  createdAt: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HelpService {
  constructor(private apiService: ApiService) {}

  submitSupportRequest(formData: SupportRequestData): Observable<ServiceTicketResponse> {
    const requestBody = {
      formType: 'support_request',
      data: {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        description: formData.message,
        category: 'other',
        priority: 'normal'
      }
    };

    return this.apiService.post<ServiceTicketResponse>(
      '/service-tickets/support_request/submit',
      requestBody
    );
  }

  submitFeedback(formData: FeedbackData): Observable<ServiceTicketResponse> {
    const requestBody = {
      formType: 'feedback',
      data: {
        name: formData.name,
        email: formData.email,
        category: formData.category,
        message: formData.message
      }
    };

    return this.apiService.post<ServiceTicketResponse>(
      '/service-tickets/feedback/submit',
      requestBody
    );
  }
}
