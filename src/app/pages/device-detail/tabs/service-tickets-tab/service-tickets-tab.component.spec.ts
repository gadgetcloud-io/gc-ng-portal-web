import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ServiceTicketsTabComponent } from './service-tickets-tab.component';
import { ServiceTicketService } from '../../../../core/services/service-ticket.service';
import { Device } from '../../../../core/services/device.service';
import { ServiceTicket, CreateTicketRequest } from '../../../../core/models/service-ticket.model';
import { ServiceRequestData } from '../../../../shared/components/service-request-dialogs/create-service-request-dialog';

describe('ServiceTicketsTabComponent', () => {
  let component: ServiceTicketsTabComponent;
  let fixture: ComponentFixture<ServiceTicketsTabComponent>;
  let mockServiceTicketService: any;
  let mockChangeDetectorRef: any;

  const mockDevice: Device = {
    id: 'ITM_00001',
    name: 'iPhone 15 Pro',
    manufacturer: 'Apple',
    model: 'iPhone 15 Pro',
    category: 'phone',
    status: 'active',
    serialNumber: 'ABC123',
    purchaseDate: '2024-01-01',
    purchasePrice: 999,
    warrantyExpires: '2025-01-01'
  };

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
      status: 'in_progress',
      priority: 'normal',
      data: {
        requestType: 'maintenance',
        deviceId: 'ITM_00001',
        issueDescription: 'Regular checkup',
        urgency: 'normal'
      },
      emailSent: true,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockServiceTicketService = {
      listTickets: vi.fn(),
      createTicket: vi.fn(),
      getTicket: vi.fn()
    };
    mockChangeDetectorRef = {
      detectChanges: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ServiceTicketsTabComponent],
      providers: [
        { provide: ServiceTicketService, useValue: mockServiceTicketService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceTicketsTabComponent);
    component = fixture.componentInstance;
    component.device = mockDevice;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load tickets on init', () => {
      mockServiceTicketService.listTickets.mockReturnValue(of(mockTickets));

      component.ngOnInit();

      expect(mockServiceTicketService.listTickets).toHaveBeenCalledWith('ITM_00001');
      expect(component.tickets).toEqual(mockTickets);
      expect(component.isLoading).toBe(false);
    });

    it('should not load tickets if device is null', () => {
      component.device = null;
      mockServiceTicketService.listTickets.mockReturnValue(of([]));

      component.ngOnInit();

      expect(mockServiceTicketService.listTickets).not.toHaveBeenCalled();
    });
  });

  describe('loadTickets', () => {
    it('should set loading state and fetch tickets', () => {
      mockServiceTicketService.listTickets.mockReturnValue(of(mockTickets));

      component.loadTickets();

      expect(component.isLoading).toBe(false);
      expect(component.tickets).toEqual(mockTickets);
      expect(component.error).toBeNull();
      expect(mockChangeDetectorRef.detectChanges).toHaveBeenCalled();
    });

    it('should handle errors when loading tickets', () => {
      mockServiceTicketService.listTickets.mockReturnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.loadTickets();

      expect(component.error).toBe('Failed to load service tickets');
      expect(component.isLoading).toBe(false);
    });

    it('should return early if device is null', () => {
      component.device = null;
      mockServiceTicketService.listTickets.mockReturnValue(of([]));

      component.loadTickets();

      expect(mockServiceTicketService.listTickets).not.toHaveBeenCalled();
    });
  });

  describe('dialog management', () => {
    it('should open create dialog', () => {
      component.openCreateDialog();
      expect(component.isCreateDialogOpen).toBe(true);
    });

    it('should close create dialog', () => {
      component.isCreateDialogOpen = true;
      component.closeCreateDialog();
      expect(component.isCreateDialogOpen).toBe(false);
    });

    it('should open detail modal', () => {
      const ticket = mockTickets[0];
      component.viewTicketDetails(ticket);
      expect(component.selectedTicket).toBe(ticket);
      expect(component.isDetailModalOpen).toBe(true);
    });

    it('should close detail modal', () => {
      component.selectedTicket = mockTickets[0];
      component.isDetailModalOpen = true;

      component.closeDetailModal();

      expect(component.selectedTicket).toBeNull();
      expect(component.isDetailModalOpen).toBe(false);
    });
  });

  describe('onTicketCreated', () => {
    it('should create ticket and reload list', () => {
      const requestData: ServiceRequestData = {
        deviceId: 'ITM_00001',
        deviceName: 'iPhone 15 Pro',
        requestType: 'repair',
        priority: 'high',
        subject: 'Screen repair',
        description: 'Cracked screen needs replacement'
      };

      const expectedRequest: CreateTicketRequest = {
        formType: 'service_request',
        data: {
          requestType: 'repair',
          deviceId: 'ITM_00001',
          urgency: 'high',
          issueDescription: 'Cracked screen needs replacement',
          additionalNotes: 'Screen repair'
        },
        _website: ''
      };

      mockServiceTicketService.createTicket.mockReturnValue(
        of({
          id: 'TKT_00003',
          formType: 'service_request',
          status: 'submitted',
          userId: '111a',
          emailSent: true,
          createdAt: '2024-01-03T00:00:00Z',
          message: 'Created successfully'
        })
      );
      mockServiceTicketService.listTickets.mockReturnValue(of(mockTickets));

      component.onTicketCreated(requestData);

      expect(mockServiceTicketService.createTicket).toHaveBeenCalledWith(
        expect.objectContaining(expectedRequest)
      );
      expect(component.isCreateDialogOpen).toBe(false);
    });

    it('should handle error when creating ticket', () => {
      const requestData: ServiceRequestData = {
        deviceId: 'ITM_00001',
        deviceName: 'iPhone 15 Pro',
        requestType: 'repair',
        priority: 'high',
        subject: 'Screen repair',
        description: 'Cracked screen'
      };

      mockServiceTicketService.createTicket.mockReturnValue(
        throwError(() => new Error('Failed to create'))
      );

      vi.spyOn(window, 'alert').mockImplementation(() => {});
      component.onTicketCreated(requestData);

      expect(window.alert).toHaveBeenCalledWith(
        'Failed to create service ticket. Please try again.'
      );
    });
  });

  describe('helper methods', () => {
    it('should map priority to urgency correctly', () => {
      expect((component as any).mapPriorityToUrgency('low')).toBe('low');
      expect((component as any).mapPriorityToUrgency('medium')).toBe('normal');
      expect((component as any).mapPriorityToUrgency('high')).toBe('high');
      expect((component as any).mapPriorityToUrgency('urgent')).toBe('critical');
      expect((component as any).mapPriorityToUrgency('unknown')).toBe('normal');
    });

    it('should return correct status colors', () => {
      expect(component.getStatusColor('submitted')).toBe('#6b7280');
      expect(component.getStatusColor('open')).toBe('#3b82f6');
      expect(component.getStatusColor('in_progress')).toBe('#f59e0b');
      expect(component.getStatusColor('resolved')).toBe('#10b981');
    });

    it('should return correct priority colors', () => {
      expect(component.getPriorityColor('urgent')).toBe('#ef4444');
      expect(component.getPriorityColor('high')).toBe('#f59e0b');
      expect(component.getPriorityColor('normal')).toBe('#3b82f6');
      expect(component.getPriorityColor('low')).toBe('#6b7280');
    });

    it('should format status text correctly', () => {
      expect(component.formatStatus('in_progress')).toBe('In Progress');
      expect(component.formatStatus('pending_customer')).toBe('Pending Customer');
    });

    it('should format request type correctly', () => {
      expect(component.formatRequestType('warranty_claim')).toBe('Warranty Claim');
      expect(component.formatRequestType('repair')).toBe('Repair');
    });

    it('should return correct request type icons', () => {
      expect(component.getRequestTypeIcon('repair')).toBe('🔧');
      expect(component.getRequestTypeIcon('maintenance')).toBe('🛠️');
      expect(component.getRequestTypeIcon('warranty_claim')).toBe('🛡️');
      expect(component.getRequestTypeIcon('unknown')).toBe('📝');
    });

    it('should format date correctly', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const twoWeeksAgo = new Date(today);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      expect(component.formatDate(today.toISOString())).toBe('Today');
      expect(component.formatDate(yesterday.toISOString())).toBe('Yesterday');
      expect(component.formatDate(threeDaysAgo.toISOString())).toBe('3 days ago');
      expect(component.formatDate(twoWeeksAgo.toISOString())).toContain(
        twoWeeksAgo.toLocaleDateString('en-US', { month: 'short' })
      );
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe on destroy', () => {
      const destroySpy = vi.spyOn(component['destroy$'], 'next');
      const completeSpy = vi.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
