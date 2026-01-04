import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ServiceTicketService } from './service-ticket.service';
import {
  ServiceTicket,
  CreateTicketRequest,
  CreateTicketResponse,
  TicketMessage
} from '../models/service-ticket.model';
import { environment } from '../../../environments/environment';

describe('ServiceTicketService', () => {
  let service: ServiceTicketService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ServiceTicketService]
    });
    service = TestBed.inject(ServiceTicketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listTickets', () => {
    it('should fetch tickets with query parameters', async () => {
      const mockTickets: ServiceTicket[] = [
        {
          id: 'TKT_00001',
          formType: 'service_request',
          userId: '111a',
          status: 'open',
          priority: 'high',
          data: {
            requestType: 'repair',
            deviceId: 'ITM_00001',
            issueDescription: 'Screen is cracked',
            urgency: 'high'
          },
          emailSent: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const responsePromise = firstValueFrom(service.listTickets());

      const req = httpMock.expectOne(
        `${environment.apiUrl}/service-tickets?form_type=service_request&limit=100`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTickets);

      const response = await responsePromise;
      expect(response).toEqual(mockTickets);
    });

    it('should filter tickets by deviceId on client side', async () => {
      const mockTickets: ServiceTicket[] = [
        {
          id: 'TKT_00001',
          formType: 'service_request',
          userId: '111a',
          status: 'open',
          priority: 'high',
          data: {
            requestType: 'repair',
            deviceId: 'ITM_00001',
            issueDescription: 'Screen is cracked',
            urgency: 'high'
          },
          emailSent: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'TKT_00002',
          formType: 'service_request',
          userId: '111a',
          status: 'open',
          priority: 'normal',
          data: {
            requestType: 'maintenance',
            deviceId: 'ITM_00002',
            issueDescription: 'Regular checkup',
            urgency: 'normal'
          },
          emailSent: true,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        }
      ];

      const responsePromise = firstValueFrom(service.listTickets('ITM_00001'));

      const req = httpMock.expectOne(
        `${environment.apiUrl}/service-tickets?form_type=service_request&limit=100`
      );
      req.flush(mockTickets);

      const response = await responsePromise;
      expect(response.length).toBe(1);
      expect(response[0].id).toBe('TKT_00001');
      expect(response[0].data.deviceId).toBe('ITM_00001');
    });

    it('should support custom limit', async () => {
      const mockTickets: ServiceTicket[] = [];

      const responsePromise = firstValueFrom(service.listTickets(undefined, 50));

      const req = httpMock.expectOne(
        `${environment.apiUrl}/service-tickets?form_type=service_request&limit=50`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockTickets);

      await responsePromise;
    });
  });

  describe('createTicket', () => {
    it('should create a new service ticket', async () => {
      const mockRequest: CreateTicketRequest = {
        formType: 'service_request',
        data: {
          requestType: 'repair',
          deviceId: 'ITM_00001',
          urgency: 'high',
          issueDescription: 'Screen is broken',
          additionalNotes: 'Urgent repair needed'
        },
        _website: ''
      };

      const mockResponse: CreateTicketResponse = {
        id: 'TKT_00003',
        formType: 'service_request',
        status: 'submitted',
        userId: '111a',
        emailSent: true,
        createdAt: '2024-01-03T00:00:00Z',
        message: 'Service request submitted successfully'
      };

      const responsePromise = firstValueFrom(service.createTicket(mockRequest));

      const req = httpMock.expectOne(
        `${environment.apiUrl}/service-tickets/service_request/submit`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);

      const response = await responsePromise;
      expect(response.id).toBe('TKT_00003');
      expect(response.message).toBe('Service request submitted successfully');
    });
  });

  describe('getTicket', () => {
    it('should fetch a single ticket by ID', async () => {
      const mockTicket: ServiceTicket = {
        id: 'TKT_00001',
        formType: 'service_request',
        userId: '111a',
        status: 'open',
        priority: 'high',
        data: {
          requestType: 'repair',
          deviceId: 'ITM_00001',
          issueDescription: 'Screen is cracked',
          urgency: 'high'
        },
        emailSent: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const responsePromise = firstValueFrom(service.getTicket('TKT_00001'));

      const req = httpMock.expectOne(`${environment.apiUrl}/service-tickets/TKT_00001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTicket);

      const response = await responsePromise;
      expect(response).toEqual(mockTicket);
    });
  });

  describe('getMessages', () => {
    it('should fetch messages for a ticket', async () => {
      const mockMessages: TicketMessage[] = [
        {
          id: 'MSG_001',
          message: 'I have received your device',
          senderRole: 'support',
          senderName: 'Support Team',
          senderId: '222a',
          createdAt: '2024-01-01T10:00:00Z'
        },
        {
          id: 'MSG_002',
          message: 'Thank you for the update',
          senderRole: 'customer',
          senderName: 'Customer One',
          senderId: '111a',
          createdAt: '2024-01-01T11:00:00Z'
        }
      ];

      const responsePromise = firstValueFrom(service.getMessages('TKT_00001'));

      const req = httpMock.expectOne(
        `${environment.apiUrl}/service-tickets/TKT_00001/messages`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockMessages);

      const response = await responsePromise;
      expect(response.length).toBe(2);
      expect(response[0].senderRole).toBe('support');
      expect(response[1].senderRole).toBe('customer');
    });
  });

  describe('addMessage', () => {
    it('should add a message to a ticket', async () => {
      const responsePromise = firstValueFrom(
        service.addMessage('TKT_00001', 'This is my reply')
      );

      const req = httpMock.expectOne(
        `${environment.apiUrl}/service-tickets/TKT_00001/messages`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ message: 'This is my reply' });
      req.flush(null);

      await responsePromise;
    });
  });
});
