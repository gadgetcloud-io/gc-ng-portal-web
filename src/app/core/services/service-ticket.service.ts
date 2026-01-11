import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  ServiceTicket,
  CreateTicketRequest,
  CreateTicketResponse,
  TicketMessage,
  EnrichedServiceTicket,
  SupportStaff
} from '../models/service-ticket.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceTicketService {
  constructor(private api: ApiService) {}

  /**
   * List service tickets (optionally filtered by deviceId)
   * @param deviceId Optional device ID to filter tickets
   * @param limit Maximum number of tickets to return
   */
  listTickets(deviceId?: string, limit: number = 100): Observable<ServiceTicket[]> {
    const endpoint = `/service-tickets?limit=${limit}`;
    return this.api.get<ServiceTicket[]>(endpoint).pipe(
      map(tickets => deviceId
        ? tickets.filter(t => t.data.deviceId === deviceId)
        : tickets
      )
    );
  }

  /**
   * Create a new service ticket
   * @param request Ticket creation request
   */
  createTicket(request: CreateTicketRequest): Observable<CreateTicketResponse> {
    return this.api.post<CreateTicketResponse>(
      '/service-tickets/service_request/submit',
      request
    );
  }

  /**
   * Get details of a specific ticket
   * @param ticketId Ticket ID
   */
  getTicket(ticketId: string): Observable<ServiceTicket> {
    return this.api.get<ServiceTicket>(`/service-tickets/${ticketId}`);
  }

  /**
   * Get all messages for a ticket
   * @param ticketId Ticket ID
   */
  getMessages(ticketId: string): Observable<TicketMessage[]> {
    return this.api.get<TicketMessage[]>(`/service-tickets/${ticketId}/messages`);
  }

  /**
   * Add a message to a ticket
   * @param ticketId Ticket ID
   * @param message Message text
   * @param isInternal Whether this is an internal note (visible only to support/admin/partner)
   */
  addMessage(ticketId: string, message: string, isInternal: boolean = false): Observable<void> {
    return this.api.post<void>(
      `/service-tickets/${ticketId}/messages`,
      { message, isInternal }
    );
  }

  /**
   * List enriched tickets with customer and device data (Support/Admin only)
   * @param limit Maximum number of tickets to return
   */
  listEnrichedTickets(limit: number = 100): Observable<EnrichedServiceTicket[]> {
    return this.api.get<EnrichedServiceTicket[]>(
      `/service-tickets/enriched?limit=${limit}`
    );
  }

  /**
   * Get list of support staff members (for ticket assignment)
   * Available to Support and Admin roles only
   */
  getSupportStaff(): Observable<SupportStaff[]> {
    return this.api.get<SupportStaff[]>('/service-tickets/support-staff');
  }

  /**
   * Update ticket assignment
   * @param ticketId Ticket ID
   * @param assignedTo User ID to assign (or null to unassign)
   */
  updateAssignment(ticketId: string, assignedTo: string | null): Observable<void> {
    return this.api.patch<void>(`/service-tickets/${ticketId}`, { assignedTo });
  }
}
