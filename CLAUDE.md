# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Context

This is **gc-ng-www-web**, the Angular 21 marketing website for GadgetCloud. It serves as both the marketing site and customer portal, combining public pages with authenticated user features.

**Part of**: Sprint workspace at `/Users/ganesh/projects/gc-sprint-03/` containing backend (gc-py-backend), infrastructure (gc-tf-gcp-infra), and this frontend.

**Backend API**: FastAPI service at `http://localhost:8000` (local) or Cloud Run endpoints (staging/production).

## Development Commands

```bash
# Start development server (port 4200)
npm start

# Run tests (Vitest)
npm test
npm test -- --run        # Single run (no watch)
npm test -- --coverage   # With coverage

# Build
npm run build                                    # Development build
npm run build -- --configuration=staging         # Staging build
npm run build -- --configuration=production      # Production build

# Generate components
ng generate component pages/new-page
ng generate component shared/components/new-component
```

## Deployment

The frontend is hosted on **AWS S3 + CloudFront** for both staging and production environments.

**Migration Note**: Migrated from Firebase Hosting to AWS S3 + CloudFront in January 2025 for better integration with existing AWS infrastructure and reduced deployment complexity.

### Staging
```bash
# Deploy to staging (builds + uploads to S3 + invalidates CloudFront)
npm run deploy:stg
```

**What it does:**
1. Builds Angular app with staging configuration (uses `environment.stg.ts`)
2. Syncs files to S3 bucket: `www-stg.gadgetcloud.io`
3. Sets cache headers:
   - HTML: `no-cache, no-store, must-revalidate`
   - JS/CSS: `public, max-age=300, immutable` (5 minutes)
   - Other files: `public, max-age=300` (5 minutes)
4. Creates CloudFront invalidation for `/*`
5. Waits for invalidation to complete

**Manual deployment (if needed):**
```bash
# Step-by-step
npm run build -- --configuration=staging
./deploy-to-s3.sh stg
```

### Production
```bash
# Deploy to production (builds + uploads to S3 + invalidates CloudFront)
npm run deploy:prd
```

**What it does:**
1. Builds Angular app with production configuration (uses `environment.prd.ts`)
2. Syncs files to S3 bucket: `www.gadgetcloud.io`
3. Sets cache headers (same as staging)
4. Creates CloudFront invalidation
5. Waits for invalidation to complete

**Manual deployment (if needed):**
```bash
# Step-by-step
npm run build -- --configuration=production
./deploy-to-s3.sh prd
```

### Deployment Details

**S3 Buckets:**
- **Staging**: `www-stg.gadgetcloud.io` → https://www-stg.gadgetcloud.io
- **Production**: `www.gadgetcloud.io` → https://www.gadgetcloud.io
- **Apex Redirect**: `gadgetcloud.io` → https://gadgetcloud.io → redirects to https://www.gadgetcloud.io

**CloudFront Distributions:**
- **Staging**: `E1LLF7FUWQJVQN`
- **Production**: `E1D6C4DNXVFZXX`
- Minimal caching enabled (5-minute TTL) for easier debugging
- Custom error responses: 404/403 → 200 /index.html (SPA routing support)
- SSL certificates: AWS ACM (us-east-1 region)
- Price class: PriceClass_100 (North America + Europe)

**Cache Invalidation:**
- Automatically triggered after each deployment
- Invalidates all paths (`/*`)
- Takes ~30-60 seconds to complete
- Script waits for completion before reporting success

**Prerequisites:**
- AWS CLI installed and configured with `gc` profile
- CloudFront distribution IDs set in `deploy-to-s3.sh` (updated by Terraform outputs)

## Architecture

### Tech Stack
- **Angular**: 21.0.0 with standalone components (no NgModules)
- **TypeScript**: 5.9.2
- **Testing**: Vitest 4.0.8 (not Karma/Jasmine)
- **Styling**: SCSS with design tokens
- **Routing**: Lazy-loaded pages with guards

### Project Structure
```
src/
├── app/
│   ├── pages/                    # Lazy-loaded page components
│   │   ├── home/                 # Public marketing homepage
│   │   ├── features/             # Public features page
│   │   ├── pricing/              # Public pricing page
│   │   ├── about/                # Public about page
│   │   ├── contact/              # Public contact page
│   │   ├── dashboard/            # Protected: User dashboard
│   │   ├── profile/              # Protected: User profile
│   │   ├── devices/              # Protected: Device management (My Gadgets)
│   │   ├── device-detail/        # Protected: Single device view
│   │   └── service-requests/     # Protected: Service tickets
│   ├── shared/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── button/           # Button with 4 variants
│   │   │   ├── header/           # Site navigation
│   │   │   ├── footer/           # Site footer
│   │   │   ├── breadcrumbs/      # Breadcrumb navigation
│   │   │   ├── tabs/             # Tab interface
│   │   │   ├── device-card/      # Device list item
│   │   │   ├── device-list/      # Device grid/list
│   │   │   └── *-dialog/         # Modal dialogs
│   │   └── directives/           # Custom directives
│   └── core/
│       ├── services/             # Business logic & API calls
│       │   ├── auth.service.ts   # Authentication & user management
│       │   ├── api.service.ts    # HTTP wrapper with timeout
│       │   ├── device.service.ts # Device/item CRUD
│       │   ├── document.service.ts # File uploads & downloads
│       │   ├── rbac.service.ts   # Role-based access control
│       │   ├── activity.service.ts # Audit log queries
│       │   ├── seo.service.ts    # Meta tags & SEO
│       │   ├── breadcrumb.service.ts # Breadcrumb state
│       │   └── contact-form.service.ts # Contact submissions
│       ├── guards/
│       │   ├── auth.guard.ts     # Protects authenticated routes
│       │   └── public.guard.ts   # Redirects logged-in users from public pages
│       ├── interceptors/
│       │   └── auth.interceptor.ts # Adds JWT to requests, handles 401
│       ├── models/               # TypeScript interfaces
│       └── config/               # App configuration
├── styles/
│   ├── _design-tokens.scss       # Color, typography, spacing variables
│   ├── _base.scss                # Reset, utility classes, animations
│   ├── _dialog-forms.scss        # Modal form styling
│   └── _stepper.scss             # Multi-step form styling
└── environments/
    ├── environment.ts            # Local dev (localhost:8000)
    ├── environment.stg.ts        # Staging Cloud Run
    └── environment.prd.ts        # Production Cloud Run
```

### Routing & Guards

**Public Routes** (redirect to dashboard if logged in):
- `/` - Homepage
- `/features` - Features page
- `/pricing` - Pricing page
- `/about` - About page
- `/contact` - Contact page

**Protected Routes** (require authentication):
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/my-gadgets` - Device list
- `/my-gadgets/:id` - Device details with tabs
- `/service-requests` - Service ticket list

Guards defined in `app.routes.ts` using `canActivate`:
- `authGuard`: Redirects to home if not logged in
- `publicGuard`: Redirects to dashboard if already logged in

### Environment Configuration

**Local Development** (`environment.ts`):
```typescript
apiUrl: 'http://localhost:8000/api'
enableLogging: true
```

**Staging** (`environment.stg.ts`):
```typescript
apiUrl: 'https://gc-py-backend-198991430816.asia-south1.run.app/api'
enableLogging: true
```

**Production** (`environment.prd.ts`):
```typescript
apiUrl: 'https://gc-py-backend-935361188774.asia-south1.run.app/api'
enableLogging: false
```

Build configurations in `angular.json` replace `environment.ts` with environment-specific files using `fileReplacements`.

## Design System

### Brand Identity - "Professional & Energetic"

**Color Palette** (defined in `src/styles/_design-tokens.scss`):
- **Ocean Blue** (`#0080C0`) - Primary brand color (buttons, links, primary actions)
- **Soft Blue** (`#67D4F6`) - Secondary color (accents, info messages)
- **Purple** (`#A78BFA`) - Accent color (creative elements, premium features)
- **Neutrals** - Text hierarchy, borders, backgrounds

**Typography**:
- **Font**: Inter (sans-serif) for all text
- **Display**: Large headings (H1: 4rem/64px, H2: 3.052rem/48px)
- **Body**: Paragraphs (1rem/16px)
- **Line Heights**: 1.2-1.4 for headings, 1.6 for body

**Spacing**: 8px-based scale
- `--space-1` (4px) through `--space-20` (160px)
- Use for padding, margin, gaps

**Border Radius**:
- `--radius-sm`: 6px
- `--radius-md`: 10px
- `--radius-lg`: 16px
- `--radius-xl`: 24px
- `--radius-full`: 9999px

**Shadows**: 6 levels (xs to 2xl) for depth

**Transitions**:
- `--transition-fast`: 150ms
- `--transition-base`: 200ms
- `--transition-slow`: 300ms

### Using Design Tokens

Always use CSS variables from `_design-tokens.scss`:
```scss
.my-component {
  background: var(--brand-primary-700);  // Ocean blue
  color: white;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}
```

**Never hardcode**:
- Colors (use `--color-*` variables)
- Spacing (use `--space-*` variables)
- Font sizes (use existing typography scale)

### Design System Components

All pages use a comprehensive set of reusable design system components. **Always prefer these components over custom HTML/CSS.**

#### Button Component
Located: `src/app/shared/components/button/`

**4 Variants**: primary, secondary, ghost, danger
**3 Sizes**: sm, md, lg
**Props**: variant, size, disabled, fullWidth

```html
<gc-button variant="primary" size="lg" (click)="handleClick()">
  Get Started
</gc-button>
<gc-button variant="secondary" [fullWidth]="true">Learn More</gc-button>
<gc-button variant="danger" size="sm">Delete</gc-button>
```

#### Card Component
Located: `src/app/shared/components/card/`

**4 Variants**: default, elevated, bordered, flat
**Padding**: none, sm, md, lg
**Props**: variant, padding, hoverable, clickable

```html
<gc-card variant="elevated" padding="md" [hoverable]="true">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</gc-card>
```

**Usage Pattern**: Wrap all card-like containers with `<gc-card>` instead of custom divs.

#### Badge Component
Located: `src/app/shared/components/badge/`

**7 Variants**: default, primary, secondary, success, warning, error, info
**3 Sizes**: sm, md, lg
**Props**: variant, size, rounded, outlined

```html
<gc-badge variant="success" size="sm">Active</gc-badge>
<gc-badge variant="warning" size="md">Expiring Soon</gc-badge>
<gc-badge variant="error" [outlined]="true">Expired</gc-badge>
```

**Conditional Variants** (for device status):
```html
<gc-badge
  [variant]="device.status === 'active' ? 'success' : device.status === 'expiring-soon' ? 'warning' : 'error'"
  size="sm"
>
  {{ statusLabel }}
</gc-badge>
```

#### Alert Component
Located: `src/app/shared/components/alert/`

**4 Variants**: success, warning, error, info
**Props**: variant, title, dismissible
**Events**: (onDismiss)

```html
<gc-alert variant="success" title="Success!" [dismissible]="true" (onDismiss)="handleDismiss()">
  Your changes have been saved successfully.
</gc-alert>

<gc-alert variant="error" [dismissible]="false">
  {{ errorMessage }}
</gc-alert>
```

**Usage Pattern**: Replace custom success/error popovers with `<gc-alert>`.

#### Loading Spinner Component
Located: `src/app/shared/components/loading-spinner/`

**3 Variants**: primary, secondary, white
**4 Sizes**: sm, md, lg, xl
**Props**: variant, size, label, centered

```html
<gc-loading-spinner
  variant="primary"
  size="lg"
  label="Loading gadgets..."
  [centered]="true"
></gc-loading-spinner>
```

**Usage Pattern**: Replace custom loading spinners with `<gc-loading-spinner>`.

#### Empty State Component
Located: `src/app/shared/components/empty-state/`

**4 Variants**: no-data, no-results, error, success
**3 Sizes**: sm, md, lg
**Props**: variant, icon, title, description, actionText, actionIcon, size
**Events**: (onAction)

```html
<gc-empty-state
  variant="no-data"
  icon="📱"
  title="No gadgets yet"
  description="Start adding gadgets to keep track of warranties"
  actionText="➕ Add Your First Gadget"
  (onAction)="openAddDialog()"
  size="lg"
></gc-empty-state>
```

**Usage Pattern**: Replace custom empty states and error messages with `<gc-empty-state>`.

#### Skeleton Component
Located: `src/app/shared/components/skeleton/`

**4 Variants**: circle, text, rect, rounded
**Props**: variant, width, height

```html
<gc-skeleton variant="circle" width="60px" height="60px"></gc-skeleton>
<gc-skeleton variant="text" width="80%"></gc-skeleton>
<gc-skeleton variant="rect" width="100%" height="150px"></gc-skeleton>
```

**Usage Pattern**: Use for loading placeholders in lists and cards.

#### Input Component
Located: `src/app/shared/components/input/`

**Props**: type, label, placeholder, prefixIcon, suffixIcon, required, disabled, state, helperText, errorText
**States**: default, success, error

```html
<gc-input
  type="email"
  label="Email Address"
  placeholder="you@example.com"
  prefixIcon="✉"
  [required]="true"
  helperText="We'll never share your email"
  [(ngModel)]="emailInput"
></gc-input>
```

#### Checkbox Component
Located: `src/app/shared/components/checkbox/`

**Props**: label, disabled, indeterminate, size (sm, md, lg)

```html
<gc-checkbox label="Accept terms" [(ngModel)]="accepted"></gc-checkbox>
<gc-checkbox label="Select all" [indeterminate]="isSomeSelected()"></gc-checkbox>
```

#### Tooltip Component
Located: `src/app/shared/components/tooltip/`

**4 Positions**: top, right, bottom, left
**Props**: text, position

```html
<gc-tooltip text="Click to edit" position="top">
  <button>Edit</button>
</gc-tooltip>
```

#### Dropdown Component
Located: `src/app/shared/components/dropdown/`

**Props**: items, triggerText, position
**Events**: (onSelect)

```html
<gc-dropdown
  [items]="dropdownItems"
  triggerText="Actions"
  position="bottom-left"
  (onSelect)="handleSelect($event)"
></gc-dropdown>
```

### Integration Status

✅ **Dashboard** - All components integrated (cards, badges, skeleton, empty states)
✅ **Devices (My Gadgets)** - All components integrated (cards, badges, loading, empty states)
✅ **Profile** - All components integrated (cards, badges, alerts)
✅ **Device Detail** - All components integrated (cards, badges, alerts, loading, empty states)

**Pattern**: All new pages and features should use design system components exclusively.

## API Integration

### Authentication Flow

1. **Login/Signup** → `auth.service.ts` calls `/api/auth/login` or `/api/auth/signup`
2. **Token Storage** → JWT stored in localStorage as `gc_token`
3. **Auto-Injection** → `auth.interceptor.ts` adds `Authorization: Bearer <token>` to all requests
4. **401 Handling** → Interceptor clears token and redirects to home on unauthorized

### HTTP Calls

Use `api.service.ts` for all HTTP requests (wraps HttpClient with timeout):
```typescript
// In a service
constructor(private api: ApiService) {}

async getData() {
  return this.api.get<ResponseType>('/endpoint');
}

async postData(body: any) {
  return this.api.post<ResponseType>('/endpoint', body);
}
```

**Never** call HttpClient directly - always use `api.service.ts` for consistent timeout and error handling.

### Service Layer Pattern

Business logic lives in `core/services/`. Components should be thin:

```typescript
// ✅ GOOD - Component calls service
export class DevicesComponent {
  devices$ = this.deviceService.getUserDevices();

  constructor(private deviceService: DeviceService) {}

  deleteDevice(id: string) {
    this.deviceService.deleteDevice(id).subscribe();
  }
}

// ❌ BAD - Component makes HTTP calls directly
export class DevicesComponent {
  constructor(private http: HttpClient) {}

  deleteDevice(id: string) {
    this.http.delete(`/api/items/${id}`).subscribe();
  }
}
```

## Testing

This project uses **Vitest**, not Karma/Jasmine.

**Run tests**:
```bash
npm test              # Watch mode
npm test -- --run     # Single run
npm test -- --coverage # Coverage report
```

**Test files**: `*.spec.ts` (located next to source files)

**Example test**:
```typescript
import { describe, it, expect } from 'vitest';

describe('ButtonComponent', () => {
  it('should render with primary variant', () => {
    // Test implementation
  });
});
```

## Key Architectural Decisions

### Standalone Components Only
All components use Angular 21's standalone architecture (no NgModules). When generating components, they are automatically standalone.

### Lazy Loading for Pages
All pages are lazy-loaded in `app.routes.ts`:
```typescript
{
  path: 'profile',
  loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent)
}
```

### No UI Library
Custom components built from scratch using design tokens. No Material, Bootstrap, or other UI frameworks. Full control over styling.

### SCSS Architecture
- Global tokens in `_design-tokens.scss`
- Global utilities in `_base.scss`
- Component-specific styles in component `.scss` files
- Import order: tokens → base → component styles

### Mobile-First Responsive
Design starts mobile and scales up:
```scss
// Mobile first
.component {
  padding: var(--space-4);

  // Tablet
  @media (min-width: 768px) {
    padding: var(--space-8);
  }

  // Desktop
  @media (min-width: 1024px) {
    padding: var(--space-12);
  }
}
```

## Backend API Endpoints

**Authentication**:
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

**Devices/Items**:
- `GET /api/items` - List user's devices
- `POST /api/items` - Create device
- `GET /api/items/:id` - Get device
- `PUT /api/items/:id` - Update device
- `DELETE /api/items/:id` - Delete device

**Documents**:
- `POST /api/documents/upload` - Upload file
- `GET /api/documents/download/:id` - Download file
- `GET /api/documents` - List documents
- `DELETE /api/documents/:id` - Delete document

**Service Tickets**:
- `GET /api/service-tickets` - List tickets
- `POST /api/service-tickets` - Create ticket
- `GET /api/service-tickets/:id` - Get ticket
- `PUT /api/service-tickets/:id` - Update ticket

**Admin** (role-based):
- `GET /api/admin/users` - List users
- `GET /api/admin/audit-logs` - Audit logs
- `PUT /api/admin/users/:id/role` - Update user role

## Common Patterns

### Component Generation
```bash
# Page component (lazy-loaded)
ng generate component pages/my-page

# Shared component
ng generate component shared/components/my-component
```

### SEO & Meta Tags
Use `seo.service.ts` in page components:
```typescript
export class MyPageComponent implements OnInit {
  constructor(private seo: SeoService) {}

  ngOnInit() {
    this.seo.setMetaTags({
      title: 'Page Title | GadgetCloud',
      description: 'Page description',
      keywords: 'gadget, cloud, management'
    });
  }
}
```

### Breadcrumbs
Configure in route data (`app.routes.ts`):
```typescript
{
  path: 'my-gadgets',
  data: {
    breadcrumb: {
      label: 'My Gadgets',
      icon: '📱'
    }
  }
}
```

Display with breadcrumb component in page template.

### Error Handling
API errors are caught and transformed in `api.service.ts`. Services should handle errors gracefully:
```typescript
getUserDevices(): Observable<Device[]> {
  return this.api.get<Device[]>('/items').pipe(
    catchError(error => {
      console.error('Failed to load devices:', error);
      return of([]); // Return empty array on error
    })
  );
}
```

## Development Workflow

### Starting Development
1. Start backend: `cd ../gc-py-backend && uvicorn app.main:app --reload --port 8000`
2. Start frontend: `npm start`
3. Open browser: `http://localhost:4200`
4. Test user: `customer1@gadgetcloud.io` / `customer1@gadgetcloud.io`

### Making Changes
1. Read existing code first (use Read tool)
2. Follow design token conventions
3. Use standalone components
4. Keep components thin (logic in services)
5. Write tests for new features
6. Test locally before deploying

### Deployment Flow
1. Make changes in local branch
2. Test locally (`npm test` + manual testing)
3. Deploy to staging (`npm run deploy:stg`)
   - Builds Angular app with staging configuration
   - Syncs to S3 (www-stg.gadgetcloud.io)
   - Invalidates CloudFront cache
4. Test staging site thoroughly: https://www-stg.gadgetcloud.io
5. Deploy to production (`npm run deploy:prd`)
   - Builds Angular app with production configuration
   - Syncs to S3 (www.gadgetcloud.io)
   - Invalidates CloudFront cache
6. Verify production:
   - https://www.gadgetcloud.io
   - https://gadgetcloud.io (should redirect to www)

## Gotchas

- **Testing framework**: Vitest, not Karma/Jasmine
- **Environment files**: Build replaces `environment.ts` - never import `.stg.ts` or `.prd.ts` directly
- **Design tokens**: Always use CSS variables, never hardcode colors/spacing
- **S3+CloudFront deployment**: Use `npm run deploy:stg` or `npm run deploy:prd` (not direct S3 sync)
- **CloudFront caching**: 5-minute TTL for debugging - invalidation required after deployment
- **Distribution IDs**: Must be updated in `deploy-to-s3.sh` after Terraform apply (see TODO comments)
- **API URLs**: Different for local/staging/production - managed by environment files
- **Component architecture**: Standalone only (no NgModules)
- **Lazy loading**: All pages must be lazy-loaded for optimal performance
- **Browser support**: Modern browsers only (ES2022+ features)

## Additional Documentation

- `PROJECT_STATUS.md` - Implementation status and roadmap
- `API_INTEGRATION.md` - Detailed API integration guide
- `LEMONADE_DESIGN_PLAN.md` - Design system evolution plan
- `GADGET_CRUD_REDESIGN_PLAN.md` - Device management redesign
- `../CLAUDE.md` - Sprint workspace overview (parent directory)
- `../gc-py-backend/README.md` - Backend API documentation
