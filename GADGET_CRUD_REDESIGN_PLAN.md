# Gadget CRUD Redesign Implementation Plan

## Overview
Redesign gadget management with role-based CRUD operations, inline editing, and bulk actions.

## Current State Analysis

### Existing Components
- `src/app/pages/devices/` - Main devices page (list view)
- `src/app/shared/components/device-card/` - Individual gadget card
- `src/app/shared/components/device-list/` - List container
- `src/app/shared/components/device-stats/` - Statistics display
- `src/app/shared/components/device-dialogs/` - Add/Edit/Delete dialogs

### Current Data Model
```typescript
interface Device {
  id: string;
  name: string;
  category: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: string;
  purchasePrice?: number;
  warrantyExpires: string;
  warrantyProvider?: string;
  status: 'active' | 'expiring-soon' | 'expired';
  image?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### Current Routes
- `/devices` - List view only
- No detail page exists yet

## Required Changes

### 1. Data Model Updates

#### A. Extend Device Interface
**File:** `src/app/core/services/device.service.ts`

Add new fields to support requirements:
```typescript
export interface Device {
  // ... existing fields ...

  // New fields for enhanced functionality
  customName?: string;          // Customer-editable friendly name
  serviceNotes?: string;         // Partner-editable service notes
  assignmentHistory?: Assignment[]; // Admin/Support tracking
  serviceTicketCount?: number;   // Cached count for performance
  statusHistory?: StatusChange[]; // Track status changes
  isActive: boolean;            // Active/Inactive toggle
  lastServiceDate?: string;     // Track last service
  nextServiceDue?: string;      // Predicted service date
}

export interface Assignment {
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
  notes?: string;
}

export interface StatusChange {
  from: string;
  to: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}
```

#### B. Role-Based Permissions Model
**New File:** `src/app/core/models/device-permissions.model.ts`

```typescript
export interface DevicePermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  canBulkEdit: boolean;
  editableFields: string[];
}

export const DEVICE_PERMISSIONS: Record<string, DevicePermissions> = {
  customer: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canChangeStatus: false,
    canBulkEdit: true,
    editableFields: ['customName', 'notes']
  },
  partner: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canChangeStatus: true,
    canBulkEdit: true,
    editableFields: ['customName', 'notes', 'serviceNotes']
  },
  support: {
    canView: true,
    canEdit: true,
    canDelete: false,
    canChangeStatus: true,
    canBulkEdit: false,
    editableFields: ['customName', 'notes', 'serviceNotes', 'status', 'assignmentHistory']
  },
  admin: {
    canView: true,
    canEdit: true,
    canDelete: true,
    canChangeStatus: true,
    canBulkEdit: true,
    editableFields: ['*'] // All fields
  }
};
```

### 2. Backend API Updates

#### Required Endpoints
**Note:** These need to be implemented in `gc-py-backend`

1. **GET /api/items** - List with role-based filtering
   - Query params: `?status=active&limit=50&offset=0`
   - Returns: Devices with role-appropriate fields

2. **GET /api/items/:id** - Get single device details
   - Returns: Full device with service history, tickets

3. **POST /api/items** - Create device
   - Validates: Serial uniqueness, required fields
   - Returns: Created device

4. **PATCH /api/items/:id** - Update device (inline edit)
   - Validates: Role permissions, field editability
   - Returns: Updated device

5. **DELETE /api/items/:id** - Delete device
   - Soft delete for admin, hard delete for customer

6. **POST /api/items/bulk-action** - Bulk operations
   - Body: `{ action: 'delete' | 'changeStatus', ids: string[], newStatus?: string }`
   - Returns: Success count, failures

7. **GET /api/items/:id/service-tickets** - Get linked tickets
   - Returns: Service tickets for this device

8. **GET /api/items/:id/status-history** - Get status changes
   - Returns: Status change log

### 3. Frontend Components Redesign

#### 3.1 My Gadgets Page (List & Manage)

**File:** `src/app/pages/devices/devices.ts`

##### New Features
1. **Role-based statistics**
   - Inject `AuthService` to get current user role
   - Display different stats based on role:
     ```typescript
     interface GadgetStats {
       total: number;
       active: number;
       inactive: number;
       expiringWarranties: number;
       serviceTickets?: number;      // Partner+
       pendingAssignments?: number;  // Admin/Support
     }
     ```

2. **Bulk selection**
   - Add checkbox column to device list
   - Floating action bar appears when items selected
   - Actions: Delete, Change Status, Export

3. **Enhanced filters**
   - Status: All, Active, Inactive, Expiring Warranty
   - Category: All, Phone, Laptop, Tablet, etc.
   - Date range: Purchase date, Warranty expiry

##### Component Structure
```typescript
export class DevicesComponent {
  devices: Device[] = [];
  selectedDevices: Set<string> = new Set();
  userRole: string = '';
  stats: GadgetStats = {};
  filters: DeviceFilters = {};

  // Bulk operations
  selectDevice(id: string): void;
  selectAll(): void;
  deselectAll(): void;
  bulkDelete(): void;
  bulkChangeStatus(newStatus: string): void;

  // Filtering
  applyFilters(): void;
  resetFilters(): void;
}
```

##### Template Changes
**File:** `src/app/pages/devices/devices.html`

Add:
- Bulk selection checkboxes
- Floating action bar for bulk ops
- Role-based stats display
- Enhanced filter UI

#### 3.2 Gadget Details Page (NEW)

**New Files:**
- `src/app/pages/device-detail/device-detail.ts`
- `src/app/pages/device-detail/device-detail.html`
- `src/app/pages/device-detail/device-detail.scss`

##### Layout (E-commerce Product Style)
```
┌─────────────────────────────────────────────────────┐
│ ← Back to My Gadgets              [Edit] [Delete]   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐    📱 iPhone 15 Pro Max          │
│  │              │    Apple • Model: A2849           │
│  │   GADGET     │    Serial: ABC123XYZ             │
│  │   IMAGE      │    Status: ● Active               │
│  │              │                                    │
│  └──────────────┘    [✏️ Edit inline on hover]     │
│                                                      │
├─────────────────────────────────────────────────────┤
│ Specifications                                       │
│ ┌───────────────────────────────────────────────┐  │
│ │ Category        Phone               [✏️]      │  │
│ │ Manufacturer    Apple               [✏️]      │  │
│ │ Model           A2849               [✏️]      │  │
│ │ Serial Number   ABC123XYZ           [✏️]      │  │
│ └───────────────────────────────────────────────┘  │
│                                                      │
│ Warranty Information                                 │
│ ┌───────────────────────────────────────────────┐  │
│ │ Purchase Date   2024-01-15          [✏️]      │  │
│ │ Purchase Price  $1,299.00           [✏️]      │  │
│ │ Warranty Until  2026-01-15          [✏️]      │  │
│ │ Provider        AppleCare+          [✏️]      │  │
│ └───────────────────────────────────────────────┘  │
│                                                      │
│ Notes                                                │
│ ┌───────────────────────────────────────────────┐  │
│ │ Customer Notes:                                │  │
│ │ Gift from Dad. Handle with care.    [✏️]      │  │
│ │                                                │  │
│ │ Service Notes (Partner only):                 │  │
│ │ Screen replaced on 2024-06-10       [✏️]      │  │
│ └───────────────────────────────────────────────┘  │
│                                                      │
│ Service History                                      │
│ ┌───────────────────────────────────────────────┐  │
│ │ #TKT001 - Screen Repair    2024-06-10        │  │
│ │ #TKT002 - Battery Check    2024-03-15        │  │
│ └───────────────────────────────────────────────┘  │
│                                                      │
│ Status History (Admin/Support only)                 │
│ ┌───────────────────────────────────────────────┐  │
│ │ 2024-01-15  Created       by customer1       │  │
│ │ 2024-06-10  Active → Servicing  by partner1  │  │
│ │ 2024-06-12  Servicing → Active  by partner1  │  │
│ └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

##### Inline Editing Implementation

**New Component:** `src/app/shared/components/inline-edit-field/inline-edit-field.ts`

```typescript
@Component({
  selector: 'gc-inline-edit-field',
  template: `
    <div class="inline-edit-field"
         [class.editing]="isEditing"
         (mouseenter)="showEditIcon = canEdit"
         (mouseleave)="showEditIcon = false">

      <!-- Display Mode -->
      <div *ngIf="!isEditing" class="display-mode">
        <span class="field-value">{{ value || placeholder }}</span>
        <button
          *ngIf="showEditIcon && canEdit"
          class="edit-icon"
          (click)="startEdit()"
          title="Click to edit">
          ✏️
        </button>
      </div>

      <!-- Edit Mode -->
      <div *ngIf="isEditing" class="edit-mode">
        <input
          *ngIf="type === 'text'"
          [(ngModel)]="editValue"
          (blur)="save()"
          (keyup.enter)="save()"
          (keyup.escape)="cancel()"
          [placeholder]="placeholder"
          #editInput />

        <textarea
          *ngIf="type === 'textarea'"
          [(ngModel)]="editValue"
          (blur)="save()"
          (keyup.escape)="cancel()"
          #editInput></textarea>

        <select
          *ngIf="type === 'select'"
          [(ngModel)]="editValue"
          (change)="save()"
          #editInput>
          <option *ngFor="let opt of options" [value]="opt.value">
            {{ opt.label }}
          </option>
        </select>

        <div class="edit-actions">
          <button class="btn-save" (click)="save()">✓</button>
          <button class="btn-cancel" (click)="cancel()">✗</button>
        </div>
      </div>

      <!-- Validation Error -->
      <div *ngIf="error" class="validation-error">{{ error }}</div>
    </div>
  `
})
export class InlineEditFieldComponent {
  @Input() value: any;
  @Input() field: string = '';
  @Input() type: 'text' | 'textarea' | 'select' | 'date' = 'text';
  @Input() placeholder: string = '';
  @Input() canEdit: boolean = false;
  @Input() options: { value: string; label: string; }[] = [];
  @Input() validator?: (value: any) => string | null;

  @Output() valueChange = new EventEmitter<any>();

  isEditing = false;
  showEditIcon = false;
  editValue: any;
  error: string | null = null;

  @ViewChild('editInput') editInput?: ElementRef;

  startEdit(): void {
    this.isEditing = true;
    this.editValue = this.value;
    this.error = null;

    // Auto-focus input
    setTimeout(() => this.editInput?.nativeElement.focus(), 0);
  }

  async save(): Promise<void> {
    // Validate
    if (this.validator) {
      this.error = this.validator(this.editValue);
      if (this.error) return;
    }

    // Emit change
    this.valueChange.emit(this.editValue);
    this.isEditing = false;
  }

  cancel(): void {
    this.editValue = this.value;
    this.isEditing = false;
    this.error = null;
  }
}
```

##### Device Detail Component

```typescript
export class DeviceDetailComponent implements OnInit {
  deviceId: string = '';
  device: Device | null = null;
  permissions: DevicePermissions = {};
  serviceTickets: ServiceTicket[] = [];
  statusHistory: StatusChange[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private deviceService: DeviceService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.deviceId = this.route.snapshot.paramMap.get('id') || '';
    this.loadDevice();
    this.loadPermissions();
    this.loadServiceTickets();
    this.loadStatusHistory();
  }

  async loadDevice(): Promise<void> {
    this.loading = true;
    this.device = await this.deviceService.getById(this.deviceId);
    this.loading = false;
  }

  loadPermissions(): void {
    const role = this.authService.getUserRole();
    this.permissions = DEVICE_PERMISSIONS[role];
  }

  canEditField(field: string): boolean {
    if (this.permissions.editableFields.includes('*')) return true;
    return this.permissions.editableFields.includes(field);
  }

  async updateField(field: string, value: any): Promise<void> {
    if (!this.canEditField(field)) return;

    try {
      await this.deviceService.updateField(this.deviceId, field, value);
      // Update local state
      if (this.device) {
        (this.device as any)[field] = value;
      }
      // Show success toast
    } catch (error) {
      // Show error toast
    }
  }

  validateSerialNumber(value: string): string | null {
    if (!value) return 'Serial number is required';
    if (value.length < 5) return 'Serial number must be at least 5 characters';
    // Additional validation...
    return null;
  }

  async deleteDevice(): Promise<void> {
    if (!this.permissions.canDelete) return;

    const confirmed = await this.confirmDialog.open(
      'Delete Gadget',
      'Are you sure you want to delete this gadget? This action cannot be undone.'
    );

    if (confirmed) {
      await this.deviceService.delete(this.deviceId);
      this.router.navigate(['/devices']);
    }
  }
}
```

#### 3.3 Create Gadget (Simplified)

**Keep existing:** `src/app/shared/components/device-dialogs/add-device-dialog.ts`

##### Simplify Form
Focus on essential fields only:
- Serial Number (required, validated)
- Model (optional)
- Warranty Info (required)
- Custom Name (optional)

Backend handles:
- Serial uniqueness validation
- Serial format validation
- Auto-population of other fields if possible

#### 3.4 Bulk Operations UI

**New Component:** `src/app/shared/components/bulk-action-bar/bulk-action-bar.ts`

```typescript
@Component({
  selector: 'gc-bulk-action-bar',
  template: `
    <div class="bulk-action-bar" *ngIf="selectedCount > 0">
      <div class="selection-info">
        {{ selectedCount }} gadget{{ selectedCount !== 1 ? 's' : '' }} selected
      </div>
      <div class="actions">
        <button
          class="btn-bulk"
          (click)="changeStatus.emit()"
          *ngIf="permissions.canChangeStatus">
          Change Status
        </button>
        <button
          class="btn-bulk btn-danger"
          (click)="deleteSelected.emit()"
          *ngIf="permissions.canDelete">
          Delete Selected
        </button>
        <button class="btn-bulk" (click)="deselectAll.emit()">
          Clear Selection
        </button>
      </div>
    </div>
  `
})
export class BulkActionBarComponent {
  @Input() selectedCount: number = 0;
  @Input() permissions: DevicePermissions = {};

  @Output() changeStatus = new EventEmitter<void>();
  @Output() deleteSelected = new EventEmitter<void>();
  @Output() deselectAll = new EventEmitter<void>();
}
```

### 4. Service Layer Updates

**File:** `src/app/core/services/device.service.ts`

Add new methods:
```typescript
export class DeviceService {
  // ... existing methods ...

  // Single device operations
  async getById(id: string): Promise<Device> {
    return this.api.get<Device>(`/items/${id}`);
  }

  async updateField(id: string, field: string, value: any): Promise<Device> {
    return this.api.patch<Device>(`/items/${id}`, { [field]: value });
  }

  async changeStatus(id: string, newStatus: string, reason?: string): Promise<Device> {
    return this.api.patch<Device>(`/items/${id}`, {
      status: newStatus,
      statusChangeReason: reason
    });
  }

  // Bulk operations
  async bulkDelete(ids: string[]): Promise<BulkOperationResult> {
    return this.api.post<BulkOperationResult>('/items/bulk-action', {
      action: 'delete',
      ids
    });
  }

  async bulkChangeStatus(ids: string[], newStatus: string): Promise<BulkOperationResult> {
    return this.api.post<BulkOperationResult>('/items/bulk-action', {
      action: 'changeStatus',
      ids,
      newStatus
    });
  }

  // Related data
  async getServiceTickets(deviceId: string): Promise<ServiceTicket[]> {
    return this.api.get<ServiceTicket[]>(`/items/${deviceId}/service-tickets`);
  }

  async getStatusHistory(deviceId: string): Promise<StatusChange[]> {
    return this.api.get<StatusChange[]>(`/items/${deviceId}/status-history`);
  }

  // Validation
  async validateSerialNumber(serial: string): Promise<boolean> {
    const result = await this.api.get<{ isUnique: boolean }>(`/items/validate-serial/${serial}`);
    return result.isUnique;
  }
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: { id: string; error: string; }[];
}
```

### 5. Routing Updates

**File:** `src/app/app.routes.ts`

Add detail route:
```typescript
{
  path: 'devices',
  children: [
    {
      path: '',
      loadComponent: () => import('./pages/devices/devices').then(m => m.DevicesComponent),
    },
    {
      path: ':id',
      loadComponent: () => import('./pages/device-detail/device-detail').then(m => m.DeviceDetailComponent),
    }
  ]
}
```

### 6. Styling Updates

#### 6.1 Inline Edit Field Styles
**New File:** `src/app/shared/components/inline-edit-field/inline-edit-field.scss`

```scss
.inline-edit-field {
  position: relative;

  .display-mode {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: rgba(0, 180, 166, 0.05);
    }

    .field-value {
      flex: 1;
      color: #374151;
    }

    .edit-icon {
      opacity: 0;
      transition: opacity 0.2s;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 1rem;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  &:hover .edit-icon {
    opacity: 1;
  }

  .edit-mode {
    display: flex;
    gap: 0.5rem;
    align-items: center;

    input,
    textarea,
    select {
      flex: 1;
      padding: 0.5rem;
      border: 2px solid #00B4A6;
      border-radius: 4px;
      font-size: 1rem;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(0, 180, 166, 0.1);
      }
    }

    .edit-actions {
      display: flex;
      gap: 0.25rem;

      button {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;

        &.btn-save {
          background: #10b981;
          color: white;

          &:hover {
            background: #059669;
          }
        }

        &.btn-cancel {
          background: #f3f4f6;
          color: #6b7280;

          &:hover {
            background: #e5e7eb;
          }
        }
      }
    }
  }

  .validation-error {
    color: #dc2626;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
}
```

#### 6.2 Detail Page Layout
**New File:** `src/app/pages/device-detail/device-detail.scss`

```scss
.device-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    .back-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #00B4A6;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .actions {
      display: flex;
      gap: 1rem;
    }
  }

  .hero-section {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    margin-bottom: 3rem;

    .gadget-image {
      width: 300px;
      height: 300px;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8rem;
    }

    .gadget-info {
      h1 {
        font-size: 2rem;
        margin-bottom: 0.5rem;
      }

      .metadata {
        color: #6b7280;
        font-size: 1.125rem;
        margin-bottom: 1rem;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        background: #10b981;
        color: white;
        font-weight: 500;

        &.inactive {
          background: #6b7280;
        }
      }
    }
  }

  .info-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    h2 {
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      color: #111827;
    }

    .field-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;

      .field {
        .field-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }
      }
    }
  }

  .service-history {
    .ticket-item {
      padding: 1rem;
      border-left: 3px solid #00B4A6;
      background: #f9fafb;
      margin-bottom: 1rem;
      border-radius: 4px;

      .ticket-id {
        font-weight: 600;
        color: #00B4A6;
      }

      .ticket-date {
        color: #6b7280;
        font-size: 0.875rem;
      }
    }
  }

  .status-timeline {
    position: relative;
    padding-left: 2rem;

    .timeline-item {
      position: relative;
      padding-bottom: 1.5rem;

      &::before {
        content: '';
        position: absolute;
        left: -2rem;
        top: 0.5rem;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #00B4A6;
        border: 3px solid white;
        box-shadow: 0 0 0 2px #00B4A6;
      }

      &::after {
        content: '';
        position: absolute;
        left: -1.625rem;
        top: 1.5rem;
        width: 2px;
        height: calc(100% - 1rem);
        background: #e5e7eb;
      }

      &:last-child::after {
        display: none;
      }

      .timestamp {
        color: #6b7280;
        font-size: 0.875rem;
      }

      .change {
        font-weight: 500;
        color: #111827;
      }

      .actor {
        color: #6b7280;
        font-size: 0.875rem;
      }
    }
  }
}
```

#### 6.3 Bulk Action Bar
**New File:** `src/app/shared/components/bulk-action-bar/bulk-action-bar.scss`

```scss
.bulk-action-bar {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 2rem;
  z-index: 1000;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      transform: translateX(-50%) translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  .selection-info {
    font-weight: 600;
    color: #111827;
  }

  .actions {
    display: flex;
    gap: 1rem;

    .btn-bulk {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      background: #f3f4f6;
      color: #374151;

      &:hover {
        background: #e5e7eb;
        transform: translateY(-2px);
      }

      &.btn-danger {
        background: #fee2e2;
        color: #991b1b;

        &:hover {
          background: #dc2626;
          color: white;
        }
      }
    }
  }
}
```

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
**Priority:** HIGH
**Dependencies:** None

1. Update Device model in gc-py-backend
2. Implement new API endpoints:
   - GET /api/items/:id (detail)
   - PATCH /api/items/:id (inline update)
   - POST /api/items/bulk-action
   - GET /api/items/:id/service-tickets
   - GET /api/items/:id/status-history
3. Add serial number validation
4. Add role-based field filtering
5. Write API tests

**Deliverables:**
- Updated backend with new endpoints
- API documentation
- Unit tests passing

### Phase 2: Data Models & Permissions (Week 1)
**Priority:** HIGH
**Dependencies:** Phase 1

1. Update Device interface in frontend
2. Create DevicePermissions model
3. Update DeviceService with new methods
4. Add permission helper functions

**Deliverables:**
- Updated TypeScript interfaces
- Permission system implemented
- Service methods ready

### Phase 3: Inline Edit Component (Week 2)
**Priority:** MEDIUM
**Dependencies:** Phase 2

1. Create InlineEditFieldComponent
2. Add validation support
3. Style component
4. Write component tests
5. Add to shared module

**Deliverables:**
- Reusable inline edit component
- Component tests passing
- Storybook examples

### Phase 4: Device Detail Page (Week 2-3)
**Priority:** HIGH
**Dependencies:** Phase 3

1. Create DeviceDetailComponent
2. Implement e-commerce style layout
3. Integrate inline editing
4. Add service history display
5. Add status timeline (admin/support)
6. Add routing

**Deliverables:**
- Fully functional detail page
- Inline editing working
- Role-based visibility implemented

### Phase 5: List Page Enhancements (Week 3)
**Priority:** MEDIUM
**Dependencies:** Phase 2

1. Add bulk selection checkboxes
2. Create BulkActionBarComponent
3. Implement bulk delete
4. Implement bulk status change
5. Add role-based stats
6. Enhanced filtering UI

**Deliverables:**
- Bulk operations working
- Role-based stats displayed
- Enhanced filters functional

### Phase 6: Polish & Testing (Week 4)
**Priority:** HIGH
**Dependencies:** All above

1. End-to-end testing
2. Performance optimization
3. Accessibility audit
4. Mobile responsiveness
5. Error handling improvements
6. Documentation

**Deliverables:**
- E2E tests passing
- Performance benchmarks met
- Accessibility compliant
- Mobile-friendly
- User documentation

## Testing Strategy

### Unit Tests
- All service methods
- Inline edit component
- Permission helpers
- Validators

### Integration Tests
- API integration
- Role-based filtering
- Bulk operations
- Status changes

### E2E Tests
- Create gadget flow
- Edit gadget inline
- Delete gadget
- Bulk operations
- Role-based access

## Success Metrics

1. **Performance**
   - List page load < 1s
   - Detail page load < 500ms
   - Inline edit save < 300ms

2. **User Experience**
   - Inline editing works smoothly
   - Bulk operations intuitive
   - Mobile-friendly interface

3. **Code Quality**
   - 80%+ test coverage
   - No console errors
   - Passes accessibility audit

## Risks & Mitigation

### Risk 1: Backend API Delays
**Impact:** HIGH
**Mitigation:** Use mock data service initially, switch to API when ready

### Risk 2: Inline Editing Complexity
**Impact:** MEDIUM
**Mitigation:** Start with simple text fields, add complex types incrementally

### Risk 3: Role Permission Confusion
**Impact:** MEDIUM
**Mitigation:** Clear documentation, comprehensive tests, admin override

## Notes

- All user-facing text uses "Gadget" terminology
- Internal code uses "Device" for consistency with backend
- Maintain backward compatibility during transition
- Consider feature flags for gradual rollout
