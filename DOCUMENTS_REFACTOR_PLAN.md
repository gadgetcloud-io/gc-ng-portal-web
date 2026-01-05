# Documents Component Refactoring Plan

## Executive Summary

Decouple the documents-tab component from device-details to create a reusable documents management component that can be used across:
- **Devices** (existing - /my-gadgets/:id)
- **Service Tickets** (new - /service-requests/:id)
- **User Profile** (future - /profile)

## Current State Analysis

### Coupling Points

1. **documents-tab.component.ts**
   - **Line 17-18**: Hardcoded `@Input() deviceId` and `@Input() deviceName`
   - **Line 55**: Hardcoded `'item'` as parent type: `getDocumentsByParent('item', this.deviceId)`
   - **Line 100-105**: Hardcoded `deviceId` in upload request

2. **document-upload-zone.component.ts**
   - **Line 25**: Hardcoded `@Input() deviceId`
   - Device ID passed through but not actually used in component logic

3. **document.service.ts**
   - **Line 6-20**: `Document` interface has device-specific fields (`deviceId`, `deviceName`)
   - **Line 22-28**: `DocumentCreateRequest` interface has `deviceId` field
   - **Line 232**: `getDocumentsByParent()` already supports dynamic parent types ✅
   - **Line 128-136**: Upload FormData uses `deviceId` field name

4. **Backend API** (already flexible ✅)
   - **Endpoint**: `POST /api/documents/upload`
   - **Fields**: `parentType` (item, user, service_ticket), `parentId`, `documentType`, `notes`
   - **Endpoint**: `GET /api/documents/?parent_type=...&parent_id=...`
   - Backend is already decoupled and supports multiple parent types!

### Components That Are Already Reusable

1. **document-card.component.ts** ✅
   - Pure presentation component
   - No device-specific logic
   - Emits events for preview, download, delete
   - Can be reused as-is

2. **Backend API** ✅
   - Already supports `parentType` and `parentId`
   - No changes needed to backend

## Design: New Architecture

### 1. Generic Documents Component

Create a new **shared** documents component that accepts parent context:

```typescript
// Location: src/app/shared/components/documents-manager/documents-manager.component.ts

@Component({
  selector: 'app-documents-manager',
  // ...
})
export class DocumentsManagerComponent {
  @Input() parentType: 'item' | 'service_ticket' | 'user' = 'item';
  @Input() parentId: string = '';
  @Input() parentName?: string; // For display purposes (e.g., "MacBook Air", "TKT_00051")
  @Input() allowedDocumentTypes?: string[]; // Override default types for different contexts

  // ... rest of implementation
}
```

### 2. Context-Specific Wrappers

Each parent context uses the generic component with appropriate inputs:

**Device Details Tab:**
```html
<app-documents-manager
  parentType="item"
  [parentId]="deviceId"
  [parentName]="deviceName">
</app-documents-manager>
```

**Service Ticket Details:**
```html
<app-documents-manager
  parentType="service_ticket"
  [parentId]="ticketId"
  [parentName]="'Ticket ' + ticketId"
  [allowedDocumentTypes]="['photo', 'receipt', 'invoice', 'report', 'other']">
</app-documents-manager>
```

**User Profile:**
```html
<app-documents-manager
  parentType="user"
  [parentId]="userId"
  [parentName]="userName"
  [allowedDocumentTypes]="['id', 'contract', 'photo', 'other']">
</app-documents-manager>
```

### 3. Updated Service Layer

Update `document.service.ts` to use generic parent fields:

**Before:**
```typescript
interface Document {
  id: string;
  deviceId: string;      // ❌ Device-specific
  deviceName?: string;   // ❌ Device-specific
  // ...
}

interface DocumentCreateRequest {
  deviceId: string;      // ❌ Device-specific
  // ...
}
```

**After:**
```typescript
interface Document {
  id: string;
  parentType: 'item' | 'service_ticket' | 'user';  // ✅ Generic
  parentId: string;                                 // ✅ Generic
  parentName?: string;                              // ✅ Generic
  // ...
}

interface DocumentCreateRequest {
  parentType: 'item' | 'service_ticket' | 'user';  // ✅ Generic
  parentId: string;                                 // ✅ Generic
  file: File;
  type: string;
  notes?: string;
}
```

### 4. Upload FormData Mapping

Update upload method to use backend-expected field names:

**Before:**
```typescript
const formData = new FormData();
formData.append('file', request.file);
formData.append('deviceId', request.deviceId);  // ❌
```

**After:**
```typescript
const formData = new FormData();
formData.append('file', request.file);
formData.append('parentType', request.parentType);  // ✅
formData.append('parentId', request.parentId);      // ✅
formData.append('documentType', request.type);      // ✅
```

## Migration Strategy

### Phase 1: Create Shared Component (Non-Breaking)

1. Create new `src/app/shared/components/documents-manager/` directory
2. Copy documents-tab, document-card, document-upload-zone to new location
3. Rename to `documents-manager.component.*`
4. Update imports to use generic parent terminology
5. Keep old device-specific components intact for now

**Files to Create:**
- `documents-manager.component.ts`
- `documents-manager.component.html`
- `documents-manager.component.scss`
- `document-card.component.ts` (copy as-is)
- `document-upload-zone.component.ts` (update inputs)

### Phase 2: Update Service Layer (Non-Breaking)

1. Add new generic interfaces to `document.service.ts`:
   - `GenericDocument` (with parentType/parentId)
   - `GenericDocumentCreateRequest`
2. Update `createDocument()` method to support both old and new interfaces
3. Add backward compatibility layer for existing device code

### Phase 3: Update Device Details to Use New Component

1. Update `device-detail.ts` to import `DocumentsManagerComponent`
2. Replace `<app-documents-tab>` with `<app-documents-manager parentType="item">`
3. Test thoroughly to ensure no regressions

### Phase 4: Add to Service Tickets

1. Add documents section to service-ticket-detail page
2. Use `<app-documents-manager parentType="service_ticket">`
3. Configure allowed document types for service tickets

### Phase 5: Cleanup (Breaking Changes)

1. Remove old device-specific components:
   - `documents-tab.component.*`
   - Old document-upload-zone from device-detail/components
2. Remove deprecated interfaces from document.service.ts
3. Update all references

## Implementation Steps

### Step 1: Create Shared Documents Manager Component

```bash
# Create new component directory
mkdir -p src/app/shared/components/documents-manager

# Files to create:
# - documents-manager.component.ts
# - documents-manager.component.html
# - documents-manager.component.scss
```

**Key Changes:**
- Accept `@Input() parentType`, `@Input() parentId`, `@Input() parentName`
- Replace `deviceId` references with `parentId`
- Replace `deviceName` references with `parentName`
- Make document types configurable via `@Input() allowedDocumentTypes`

### Step 2: Update Document Service

**Add generic interfaces:**
```typescript
export interface GenericDocument {
  id: string;
  name: string;
  type: string;
  parentType: 'item' | 'service_ticket' | 'user';
  parentId: string;
  parentName?: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  // ...
}

export interface GenericDocumentCreateRequest {
  name: string;
  type: string;
  parentType: 'item' | 'service_ticket' | 'user';
  parentId: string;
  file: File;
  notes?: string;
}
```

**Update createDocument() method:**
```typescript
createDocument(request: GenericDocumentCreateRequest): Observable<{
  success: boolean;
  document?: GenericDocument;
  error?: string;
}> {
  if (this.useApi) {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('parentType', request.parentType);
    formData.append('parentId', request.parentId);
    formData.append('documentType', request.type);
    if (request.notes) {
      formData.append('notes', request.notes);
    }

    return this.apiService.post<ApiResponse<GenericDocument>>('/documents/upload', formData)
      // ...
  }
}
```

### Step 3: Update Document Card Component

Copy as-is to shared location, or update the document interface import:

```typescript
// No changes needed - already generic!
export interface Document {
  id: string;
  fileName: string;
  documentType: string;
  fileSize: number;
  uploadedAt: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
}
```

### Step 4: Update Document Upload Zone

**Update inputs:**
```typescript
@Input() parentType: 'item' | 'service_ticket' | 'user' = 'item';
@Input() parentId: string = '';
@Input() allowedDocumentTypes: string[] = [
  'receipt', 'invoice', 'warranty', 'photo', 'manual',
  'report', 'contract', 'id', 'other'
];
```

**Remove device-specific display logic** (line 4 in current template uses `deviceId`)

### Step 5: Test Migration with Device Details

1. Update device-detail component to use new shared component
2. Verify all functionality works:
   - ✅ Upload documents
   - ✅ Filter by type
   - ✅ Preview documents
   - ✅ Download documents
   - ✅ Delete documents
   - ✅ Loading states
   - ✅ Error states
3. Test with multiple devices

### Step 6: Add Documents to Service Ticket Detail Page

**Update service-ticket-detail.html:**
```html
<!-- In right column, after Request Details section -->
<section class="documents-section">
  <h3 class="section-title">Attachments</h3>
  <app-documents-manager
    parentType="service_ticket"
    [parentId]="ticket.id"
    [parentName]="'Ticket ' + ticket.id"
    [allowedDocumentTypes]="['photo', 'receipt', 'invoice', 'report', 'other']">
  </app-documents-manager>
</section>
```

**Update service-ticket-detail.ts:**
```typescript
import { DocumentsManagerComponent } from '../../../shared/components/documents-manager/documents-manager.component';

@Component({
  // ...
  imports: [
    CommonModule,
    FormsModule,
    DocumentsManagerComponent  // Add this
  ]
})
```

### Step 7: Add Documents to User Profile (Future)

Similar pattern:
```html
<app-documents-manager
  parentType="user"
  [parentId]="user.id"
  [parentName]="user.firstName + ' ' + user.lastName"
  [allowedDocumentTypes]="['id', 'contract', 'photo', 'other']">
</app-documents-manager>
```

## Document Type Recommendations

### For Devices (Items)
- Receipt
- Invoice
- Warranty
- Photo
- Manual
- Other

### For Service Tickets
- Photo (issue evidence)
- Receipt
- Invoice
- Report (inspection/repair reports)
- Other

### For User Profile
- ID (identification documents)
- Contract (service agreements)
- Photo
- Other

## Testing Checklist

### Devices (Existing Functionality)
- [ ] Upload document to device
- [ ] View documents for device
- [ ] Filter documents by type
- [ ] Download document
- [ ] Delete document
- [ ] Preview document (when implemented)
- [ ] Upload multiple files
- [ ] Upload PDF and convert to images
- [ ] Handle upload errors
- [ ] Handle network errors
- [ ] Loading states display correctly
- [ ] Empty states display correctly

### Service Tickets (New Functionality)
- [ ] Upload document to service ticket
- [ ] View documents for service ticket
- [ ] Filter documents by type
- [ ] Download document
- [ ] Delete document
- [ ] Documents persist after page refresh
- [ ] Support role can see customer-uploaded documents
- [ ] Customer can see support-uploaded documents
- [ ] Document types match service ticket context

### User Profile (Future)
- [ ] Upload document to user profile
- [ ] View documents for user
- [ ] Document types match user context

## Benefits

1. **Code Reusability**: Single component handles all document management
2. **Consistency**: Same UX across devices, tickets, and profiles
3. **Maintainability**: Bug fixes and features apply everywhere
4. **Type Safety**: Generic parent type prevents errors
5. **Backend Compatibility**: Frontend now matches backend's flexible API
6. **Scalability**: Easy to add new parent types in future

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing device functionality | High | Phase 1-3 maintain backward compatibility |
| Document type mismatches across contexts | Medium | Configure allowed types per parent type |
| Service integration complexity | Medium | Use generic interfaces, comprehensive testing |
| Performance with many documents | Low | Backend already paginated, frontend can add lazy loading |

## Timeline Estimate

- **Phase 1**: Create shared component - 2 hours
- **Phase 2**: Update service layer - 1 hour
- **Phase 3**: Migrate device details - 1 hour
- **Phase 4**: Add to service tickets - 2 hours
- **Phase 5**: Cleanup - 1 hour
- **Testing**: 2 hours

**Total**: ~9 hours (1-2 days)

## Success Criteria

1. ✅ Documents component is fully decoupled from device context
2. ✅ Same component works for devices, service tickets, and user profiles
3. ✅ All existing device document functionality works without regression
4. ✅ Service ticket documents can be uploaded and managed
5. ✅ Code is cleaner and more maintainable
6. ✅ Backend API compatibility maintained
7. ✅ All tests pass

## Next Steps

1. Review and approve this plan
2. Start with Phase 1: Create shared component
3. Implement incrementally with testing at each phase
4. Deploy to staging after Phase 3 for regression testing
5. Complete Phases 4-5 for full feature rollout
