# GadgetCloud Portal

Angular 21 authenticated portal for GadgetCloud - Customer dashboard, device management, and support tickets.

**🌐 Live Sites:**
- **Production**: https://my.gadgetcloud.io
- **Staging**: https://my-stg.gadgetcloud.io

**Tech Stack**: Angular 21 • TypeScript 5.9 • Vitest • SCSS • AWS S3 + CloudFront

---

## Overview

This is the authenticated portal for GadgetCloud users. After logging in on the marketing site ([www.gadgetcloud.io](https://www.gadgetcloud.io)), users are redirected here to access their dashboard, manage devices, and handle support tickets.

**What's Included:**
- ✅ User dashboard with quick stats
- ✅ Device management (My Gadgets)
- ✅ Device detail pages with tabs
- ✅ User profile management
- ✅ Service ticket system
- ✅ Password reset & email verification flows

**What's NOT Included** (see [gc-ng-www-web](https://github.com/gadgetcloud-io/gc-ng-www-web)):
- ❌ Marketing pages (home, features, pricing, about)
- ❌ Blog
- ❌ Design system showcase
- ❌ Interactive demos

---

## Quick Start

### Development Server

Start the local development server:

```bash
npm start
```

The application will run at `http://localhost:4201/` and automatically reload on file changes.

**Note**: Portal runs on port **4201** (not 4200) to avoid conflicts with the marketing site during local development.

### Testing

Run unit tests with Vitest:

```bash
npm test              # Watch mode
npm test -- --run     # Single run
npm test -- --coverage # With coverage report
```

### Building

Build for different environments:

```bash
npm run build                                    # Development
npm run build -- --configuration=staging         # Staging
npm run build -- --configuration=production      # Production
```

Artifacts are stored in `dist/gc-ng-portal-web/browser/`.

### Deployment

**Platform**: AWS S3 + CloudFront

Deploy to staging or production with a single command:

```bash
npm run deploy:stg    # Deploy to staging (my-stg.gadgetcloud.io)
npm run deploy:prd    # Deploy to production (my.gadgetcloud.io)
```

**Deployment Process** (automated via `deploy-portal-to-s3.sh`):
1. Builds Angular app with environment-specific configuration
2. Syncs files to S3 bucket with smart cache headers
   - HTML: `no-cache, no-store, must-revalidate` (always fresh)
   - JS/CSS: `public, max-age=300, immutable` (5-minute cache)
   - Other: `public, max-age=300` (5-minute cache)
3. Creates CloudFront cache invalidation for all paths (`/*`)
4. Waits for invalidation to complete (~30-60 seconds)
5. Displays deployment success with live URLs

**Environment Details:**

| Environment | S3 Bucket | CloudFront ID | URL |
|------------|-----------|---------------|-----|
| **Production** | `my.gadgetcloud.io` | `E2C6CN3UB2T4L2` | https://my.gadgetcloud.io |
| **Staging** | `my-stg.gadgetcloud.io` | `E14WTLCWV7VL2Z` | https://my-stg.gadgetcloud.io |

**Prerequisites:**
- AWS CLI installed and configured
- AWS profile `gc` with S3 and CloudFront permissions
- CloudFront distribution IDs configured in `deploy-portal-to-s3.sh`

---

## Authentication

### Cross-Subdomain Authentication

The portal uses **cookie-based authentication** to share JWT tokens across subdomains:

**How it works:**
1. User logs in on marketing site (www.gadgetcloud.io)
2. JWT token is stored in cookie with `domain=.gadgetcloud.io`
3. User is redirected to portal (my.gadgetcloud.io)
4. Portal reads the shared cookie and authenticates automatically
5. Logout clears cookie from both domains

**Cookie Details:**
- **Name**: `gc_token`
- **Domain**: `.gadgetcloud.io` (accessible from all subdomains)
- **Expiry**: 24 hours (matches JWT expiry)
- **Security**: `Secure; SameSite=Lax`
- **Fallback**: localStorage for local development

**Implementation**: See `src/app/core/services/api.service.ts`

### Route Guards

All routes are protected by `authGuard` except auth-related pages:

- **Protected**: `/dashboard`, `/profile`, `/my-gadgets`, `/service-requests`
- **Public** (via `publicGuard`): `/forgot-password`, `/reset-password`, `/verify-email`
- **Default**: `/` redirects to `/dashboard`

---

## Project Structure

```
src/app/
├── pages/              # Lazy-loaded page components
│   ├── dashboard/      # User dashboard with stats
│   ├── profile/        # User profile management
│   ├── devices/        # Device list (My Gadgets)
│   ├── device-detail/  # Device detail with tabs
│   │   ├── tabs/       # Details, Warranty, Notes, Service Tickets
│   │   └── components/ # Warranty timeline
│   ├── service-requests/ # Service ticket list
│   ├── service-ticket-detail/ # Ticket detail view
│   ├── forgot-password/  # Password reset request
│   ├── reset-password/   # Password reset form
│   └── verify-email/     # Email verification
├── shared/
│   └── components/     # Reusable design system components
│       ├── button/     # 4 variants, 3 sizes
│       ├── card/       # 4 variants, hoverable/clickable
│       ├── badge/      # 7 variants (success, warning, error, etc.)
│       ├── alert/      # 4 variants, dismissible
│       ├── loading-spinner/ # 4 sizes
│       ├── empty-state/ # 4 variants
│       ├── skeleton/   # Loading placeholders
│       ├── input/      # Form inputs with validation
│       ├── checkbox/   # Checkbox with indeterminate
│       ├── tooltip/    # 4 positions
│       └── dropdown/   # Dropdown menu
├── core/
│   ├── services/       # Business logic & API integration
│   │   ├── auth.service.ts        # Authentication
│   │   ├── api.service.ts         # HTTP wrapper
│   │   ├── device.service.ts      # Device CRUD
│   │   ├── document.service.ts    # File uploads
│   │   ├── rbac.service.ts        # Role-based access
│   │   ├── activity.service.ts    # Audit logs
│   │   ├── seo.service.ts         # SEO meta tags
│   │   └── breadcrumb.service.ts  # Breadcrumb state
│   ├── guards/
│   │   ├── auth.guard.ts          # Protects authenticated routes
│   │   └── public.guard.ts        # Redirects logged-in users
│   ├── interceptors/
│   │   └── auth.interceptor.ts    # Adds JWT to requests
│   └── models/         # TypeScript interfaces
└── styles/
    ├── _design-tokens.scss  # Design system variables
    ├── _base.scss           # Global styles & utilities
    ├── _dialog-forms.scss   # Modal styling
    └── _stepper.scss        # Multi-step form styling
```

---

## Design System

### Components

The portal uses a comprehensive design system with reusable components shared with the marketing site:

**Core Components:**
- `<gc-button>` - 4 variants (primary, secondary, ghost, danger), 3 sizes
- `<gc-card>` - 4 variants (default, elevated, bordered, flat), hoverable/clickable
- `<gc-badge>` - 7 variants (default, primary, secondary, success, warning, error, info)
- `<gc-alert>` - 4 variants (success, warning, error, info), dismissible
- `<gc-loading-spinner>` - 4 sizes with customizable labels
- `<gc-empty-state>` - 4 variants (no-data, no-results, error, success)
- `<gc-input>` - Form inputs with prefix/suffix icons, validation states
- `<gc-checkbox>` - Checkbox with indeterminate state
- `<gc-tooltip>` - 4 positions (top, right, bottom, left)
- `<gc-dropdown>` - Dropdown menu with custom triggers
- `<gc-skeleton>` - Loading placeholders (circle, text, rect, rounded)

**Usage Example:**
```html
<gc-card variant="elevated" padding="md" [hoverable]="true">
  <gc-badge variant="success" size="sm">Active</gc-badge>
  <gc-loading-spinner variant="primary" size="lg"></gc-loading-spinner>
  <gc-empty-state variant="no-data" icon="📱"></gc-empty-state>
</gc-card>
```

### Design Tokens

All styling uses CSS variables from `src/styles/_design-tokens.scss`:

**Colors:** Ocean Blue (#0080C0), Soft Blue (#67D4F6), Purple (#A78BFA)
**Spacing:** 8px-based scale (`--space-1` through `--space-20`)
**Typography:** Inter font with display/body variants
**Shadows:** 6 levels (xs to 2xl)

See `CLAUDE.md` for complete design system documentation.

---

## Backend Integration

The portal connects to the GadgetCloud FastAPI backend via `ApiService`.

**Backend Environments:**

| Environment | API URL |
|------------|---------|
| **Local** | `http://localhost:8000/api` |
| **Staging** | `https://gc-py-backend-198991430816.asia-south1.run.app/api` |
| **Production** | `https://gc-py-backend-935361188774.asia-south1.run.app/api` |

**API Endpoints Used:**
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password
- `GET /api/items` - List devices
- `POST /api/items` - Create device
- `GET /api/items/:id` - Get device
- `PUT /api/items/:id` - Update device
- `DELETE /api/items/:id` - Delete device
- `POST /api/documents/upload` - Upload file
- `GET /api/documents` - List documents
- `GET /api/service-tickets` - List tickets
- `GET /api/service-tickets/:id` - Get ticket

See backend documentation in [gc-py-backend](https://github.com/gadgetcloud-io/gc-py-backend) repository.

---

## Code Scaffolding

Generate new components:

```bash
# Page component (lazy-loaded)
ng generate component pages/my-page

# Shared component
ng generate component shared/components/my-component
```

All components use **standalone architecture** (no NgModules).

---

## Related Repositories

- **[gc-ng-www-web](https://github.com/gadgetcloud-io/gc-ng-www-web)** - Marketing website (www.gadgetcloud.io)
- **[gc-py-backend](https://github.com/gadgetcloud-io/gc-py-backend)** - FastAPI backend
- **[gc-tf-infra](https://github.com/gadgetcloud-io/gc-tf-infra)** - Terraform infrastructure
- **[gc-ng-shared-ui](https://github.com/gadgetcloud-io/gc-ng-shared-ui)** - Shared component library (planned)

---

## Additional Resources

- **CLAUDE.md** - Detailed development guide for Claude Code
- **PROJECT_STATUS.md** - Implementation status and roadmap
- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Vitest Documentation](https://vitest.dev/)
