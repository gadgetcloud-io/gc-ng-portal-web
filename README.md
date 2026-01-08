# GadgetCloud Marketing Website

Angular 21 marketing website and customer portal for GadgetCloud - a modern platform for managing gadgets, warranties, and service requests.

**🌐 Live Sites:**
- **Production**: https://www.gadgetcloud.io
- **Staging**: https://www-stg.gadgetcloud.io

**Tech Stack**: Angular 21 • TypeScript 5.9 • Vitest • SCSS • AWS S3 + CloudFront

---

## Quick Start

### Development Server

Start the local development server:

```bash
npm start
```

The application will run at `http://localhost:4200/` and automatically reload on file changes.

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

Artifacts are stored in `dist/gc-ng-www-web/browser/`.

### Deployment

**Platform**: AWS S3 + CloudFront (migrated from Firebase Hosting in January 2025)

Deploy to staging or production with a single command:

```bash
npm run deploy:stg    # Deploy to staging (www-stg.gadgetcloud.io)
npm run deploy:prd    # Deploy to production (www.gadgetcloud.io)
```

**Deployment Process** (automated via `deploy-to-s3.sh`):
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
| **Production** | `www.gadgetcloud.io` | `E1D6C4DNXVFZXX` | https://www.gadgetcloud.io |
| **Staging** | `www-stg.gadgetcloud.io` | `E1LLF7FUWQJVQN` | https://www-stg.gadgetcloud.io |

**Prerequisites:**
- AWS CLI installed and configured
- AWS profile `gc` with S3 and CloudFront permissions
- CloudFront distribution IDs configured in `deploy-to-s3.sh`

**Manual Deployment** (if needed):
```bash
# Build first
npm run build -- --configuration=production

# Deploy with script
./deploy-to-s3.sh prd
```

---

## Design System

### Components

The app uses a comprehensive design system with reusable components:

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

## Project Structure

```
src/app/
├── pages/              # Lazy-loaded page components
│   ├── home/           # Public marketing homepage
│   │   ├── components/ # Interactive demo components
│   │   │   ├── progress-indicator/       # Engagement tracking indicator
│   │   │   ├── interactive-demo/         # Gadget addition demo
│   │   │   ├── warranty-calculator/      # ROI calculator
│   │   │   ├── before-after-slider/      # Visual comparison
│   │   │   └── save-progress-cta/        # Conversion CTA
│   │   └── services/
│   │       └── home-demo.service.ts      # Demo state management
│   ├── dashboard/      # Protected user dashboard
│   ├── devices/        # Protected device management (My Gadgets)
│   ├── device-detail/  # Protected device detail view
│   ├── profile/        # Protected user profile
│   └── design-system/  # Design system showcase
├── shared/
│   └── components/     # Reusable design system components
├── core/
│   ├── services/       # Business logic & API integration
│   ├── guards/         # Route protection
│   └── interceptors/   # HTTP interceptors
└── styles/
    ├── _design-tokens.scss  # Design system variables
    ├── _base.scss           # Global styles & utilities
    └── _dialog-forms.scss   # Modal styling
```

---

## Interactive Homepage Features

The homepage includes interactive components that let users experience the product before signing up:

### 1. **Interactive Demo**
Users can add gadgets without authentication to experience the core functionality:
- Device information form with validation
- Photo upload placeholder with AI extraction demo
- Real-time demo result cards showing added gadgets
- Demo data persists in LocalStorage

### 2. **Warranty Savings Calculator**
Interactive ROI calculator showing potential savings:
- Adjustable purchase price (default: ₹50,000)
- Warranty period slider
- Real-time savings calculation
- Visual breakdown of repair costs avoided

### 3. **Before/After Slider**
Visual comparison slider showing the value proposition:
- **Before**: Real photograph of cluttered receipts/documents
- **After**: Organized GadgetCloud dashboard
- Draggable divider (desktop) / Tap to toggle (mobile)
- Immediate visual impact

### 4. **Save Progress CTA**
Contextual conversion bar that appears after engagement:
- Triggers when engagement score ≥ 25 (1+ gadget added)
- Dynamic message: "Save My {N} Gadget(s)"
- Sticky bottom bar with dismiss option
- Transfers demo data to real account on signup

### 5. **Engagement Tracking**
`HomeDemoService` tracks user interactions and calculates engagement score:
- Adding gadget: 25 points
- Uploading photo: 15 points
- Using calculator: 10 points
- Viewing comparison: 10 points
- Exit intent detection for recovery modal

**State Management**: All demo state managed via RxJS BehaviorSubject with LocalStorage persistence.

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

## Additional Resources

- **CLAUDE.md** - Detailed development guide for Claude Code
- **PROJECT_STATUS.md** - Implementation status and roadmap
- **API_INTEGRATION.md** - Backend API integration guide
- [Angular CLI Documentation](https://angular.dev/tools/cli)
- [Vitest Documentation](https://vitest.dev/)
