// Service Ticket Models - Matches backend API

// Matches backend ServiceTicketStatus enum
export type ServiceTicketStatus =
  | 'submitted'
  | 'open'
  | 'in_progress'
  | 'pending_customer'
  | 'resolved'
  | 'closed'
  | 'processing'
  | 'completed'
  | 'failed';

// Matches backend TicketPriority enum
export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low';

// Matches backend request type options
export type RequestType =
  | 'repair'
  | 'maintenance'
  | 'inspection'
  | 'warranty_claim'
  | 'replacement';

// Full ticket detail (matches backend ServiceTicketDetail)
export interface ServiceTicket {
  id: string;
  formType: string;
  userId: string | null;
  status: ServiceTicketStatus;
  priority: TicketPriority;
  assignedTo?: string;
  data: {
    requestType: RequestType;
    deviceId?: string;
    urgency?: string;
    issueDescription: string;
    additionalNotes?: string;
    preferredContactMethod?: string;
    phoneNumber?: string;
  };
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    submittedAt?: string;
    updates?: Array<{
      timestamp: string;
      changes: Record<string, any>;
      notes?: string;
    }>;
  };
  emailSent: boolean;
  emailSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Ticket creation request
export interface CreateTicketRequest {
  formType: 'service_request';
  data: {
    requestType: RequestType;
    deviceId: string;
    urgency: 'low' | 'normal' | 'high' | 'critical';
    issueDescription: string;
    additionalNotes?: string;
    preferredContactMethod?: 'email' | 'phone' | 'both';
    phoneNumber?: string;
  };
  _website?: string; // Honeypot field
}

// Ticket creation response
export interface CreateTicketResponse {
  id: string;
  formType: string;
  status: ServiceTicketStatus;
  userId: string | null;
  emailSent: boolean;
  createdAt: string;
  message: string;
}

// Ticket message/comment
export interface TicketMessage {
  id: string;
  message: string;
  senderRole: 'customer' | 'support' | 'admin' | 'partner';
  senderName: string;
  senderId: string;
  createdAt: string;
  isInternal?: boolean; // For internal notes visible only to support/admin/partner
}

// Add message request
export interface AddMessageRequest {
  message: string;
}
