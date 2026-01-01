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

### Staging
```bash
# Build for staging (uses environment.stg.ts)
npm run build -- --configuration=staging

# Deploy to Firebase Hosting (target: web)
firebase deploy --only hosting:web --project gadgetcloud-stg

# Or deploy to both targets
firebase deploy --only hosting --project gadgetcloud-stg
```

### Production
```bash
# Build for production (uses environment.prd.ts)
npm run build -- --configuration=production

# Deploy to Firebase Hosting (target: www)
firebase deploy --only hosting:www --project gadgetcloud-prd
```

### Firebase Targets
- **Staging**: `web` target → gadgetcloud-stg.web.app
- **Production**: `www` target → gadgetcloud-web-prd.web.app (maps to www.gadgetcloud.io)

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

### Button Component

Located: `src/app/shared/components/button/`

**4 Variants**:
1. **Primary**: Ocean blue gradient with hover lift
2. **Secondary**: White with neutral border
3. **Ghost**: Transparent with neutral text
4. **Danger**: Red gradient for destructive actions

**3 Sizes**: `sm`, `md`, `lg`

**Usage**:
```html
<app-button variant="primary" size="lg" (click)="handleClick()">
  Get Started
</app-button>

<app-button variant="secondary" size="md">
  Learn More
</app-button>

<app-button variant="ghost" size="sm" [fullWidth]="true">
  Cancel
</app-button>
```

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
3. Build for staging (`npm run build -- --configuration=staging`)
4. Deploy to staging (`firebase deploy --only hosting:web --project gadgetcloud-stg`)
5. Test staging site thoroughly
6. Build for production (`npm run build -- --configuration=production`)
7. Deploy to production (`firebase deploy --only hosting:www --project gadgetcloud-prd`)

## Gotchas

- **Testing framework**: Vitest, not Karma/Jasmine
- **Environment files**: Build replaces `environment.ts` - never import `.stg.ts` or `.prd.ts` directly
- **Design tokens**: Always use CSS variables, never hardcode colors/spacing
- **Firebase targets**: Staging uses `web`, production uses `www`
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
