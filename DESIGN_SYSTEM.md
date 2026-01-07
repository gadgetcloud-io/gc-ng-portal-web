# GadgetCloud Design System

A comprehensive design system built with Angular 21, featuring 10 production-ready components, 100+ utility classes, and a complete token-based styling system.

**Live Showcase**: Navigate to `/design-system` to see all components in action.

---

## Table of Contents

- [Design Tokens](#design-tokens)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
  - [Core Components](#core-components)
  - [Advanced Components](#advanced-components)
- [Utility Classes](#utility-classes)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Design Tokens

All design tokens are defined in `src/styles/_design-tokens.scss` and should be used via CSS custom properties.

### Brand Colors

```scss
// Ocean Blue - Primary brand color
--brand-primary-700: #0080C0;
--brand-primary-600: #1A8FCC;
--brand-primary-900: #004D80;

// Soft Blue - Secondary color
--brand-secondary-700: #67D4F6;
--brand-secondary-600: #73D8F7;

// Purple - Accent color
--brand-accent-700: #A78BFA;
--brand-accent-600: #B197FC;
```

### Semantic Colors

```scss
--color-success: #10B981;     // Green for success states
--color-warning: #F59E0B;     // Orange for warnings
--color-error: #EF4444;       // Red for errors
--color-info: #3B82F6;        // Blue for information
```

### Neutral Grays

```scss
--neutral-50: #F9FAFB;
--neutral-100: #F3F4F6;
--neutral-200: #E5E7EB;
--neutral-300: #D1D5DB;
--neutral-400: #9CA3AF;
--neutral-500: #6B7280;
--neutral-600: #4B5563;
--neutral-700: #374151;
--neutral-800: #1F2937;
--neutral-900: #111827;
```

---

## Color Palette

### Usage

**✅ DO:**
```scss
.element {
  background: var(--brand-primary-700);
  color: var(--neutral-900);
}
```

**❌ DON'T:**
```scss
.element {
  background: #0080C0;  /* Never hardcode colors */
  color: #111827;
}
```

---

## Typography

### Font Family

```scss
--font-display: 'Inter', system-ui, -apple-system, sans-serif;
--font-body: 'Inter', system-ui, -apple-system, sans-serif;
```

### Font Sizes

```scss
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
--text-6xl: 3.75rem;     /* 60px */
```

### Font Weights

```scss
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights

```scss
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

## Spacing & Layout

### Spacing Scale (8px-based)

```scss
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### Border Radius

```scss
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;
```

### Shadows

```scss
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Transitions

```scss
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Components

### Core Components

#### 1. Button (`gc-button`)

**File**: `src/app/shared/components/button/`

**Variants**: `primary` | `secondary` | `ghost` | `danger`
**Sizes**: `sm` | `md` | `lg`

```html
<!-- Primary button -->
<gc-button variant="primary" size="md" (onClick)="handleClick()">
  Save Changes
</gc-button>

<!-- Secondary button -->
<gc-button variant="secondary" size="md">
  Cancel
</gc-button>

<!-- Ghost button -->
<gc-button variant="ghost" size="sm">
  Learn More
</gc-button>

<!-- Danger button (destructive actions) -->
<gc-button variant="danger" size="md" [disabled]="isProcessing">
  Delete Account
</gc-button>

<!-- Full width button -->
<gc-button variant="primary" [fullWidth]="true">
  Get Started
</gc-button>
```

**Properties**:
- `variant`: Button style variant
- `size`: Button size
- `type`: HTML button type (`button` | `submit` | `reset`)
- `disabled`: Boolean
- `fullWidth`: Boolean
- `onClick`: EventEmitter<MouseEvent>

---

#### 2. Card (`gc-card`)

**File**: `src/app/shared/components/card/`

**Variants**: `default` | `elevated` | `bordered` | `flat`
**Padding**: `none` | `sm` | `md` | `lg`

```html
<!-- Default card with medium padding -->
<gc-card variant="default" padding="md">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</gc-card>

<!-- Elevated card with shadow -->
<gc-card variant="elevated" padding="md">
  <h3>Elevated Card</h3>
  <p>This card has a prominent shadow.</p>
</gc-card>

<!-- Hoverable card -->
<gc-card variant="default" padding="md" [hoverable]="true">
  <h3>Hover me!</h3>
  <p>This card lifts on hover.</p>
</gc-card>

<!-- Clickable card -->
<gc-card variant="default" padding="md" [clickable]="true" (click)="handleCardClick()">
  <h3>Click me!</h3>
  <p>This entire card is clickable.</p>
</gc-card>
```

**Properties**:
- `variant`: Card style variant
- `padding`: Internal padding size
- `hoverable`: Boolean - adds hover lift effect
- `clickable`: Boolean - adds pointer cursor and click styles

---

#### 3. Badge (`gc-badge`)

**File**: `src/app/shared/components/badge/`

**Variants**: `default` | `primary` | `secondary` | `success` | `warning` | `error` | `info`
**Sizes**: `sm` | `md` | `lg`

```html
<!-- Status badges -->
<gc-badge variant="success">Active</gc-badge>
<gc-badge variant="warning">Pending</gc-badge>
<gc-badge variant="error">Failed</gc-badge>
<gc-badge variant="info">New</gc-badge>

<!-- Rounded badge -->
<gc-badge variant="primary" [rounded]="true">99+</gc-badge>

<!-- Outlined badge -->
<gc-badge variant="secondary" [outlined]="true">Beta</gc-badge>

<!-- Different sizes -->
<gc-badge variant="primary" size="sm">Small</gc-badge>
<gc-badge variant="primary" size="md">Medium</gc-badge>
<gc-badge variant="primary" size="lg">Large</gc-badge>
```

**Properties**:
- `variant`: Badge color variant
- `size`: Badge size
- `rounded`: Boolean - makes badge fully rounded
- `outlined`: Boolean - outline style instead of filled

---

#### 4. Alert (`gc-alert`)

**File**: `src/app/shared/components/alert/`

**Variants**: `success` | `warning` | `error` | `info`

```html
<!-- Success alert -->
<gc-alert variant="success" title="Success!" [dismissible]="true" (onDismiss)="handleDismiss()">
  Your changes have been saved successfully.
</gc-alert>

<!-- Error alert -->
<gc-alert variant="error" title="Error" [dismissible]="true">
  Something went wrong. Please try again.
</gc-alert>

<!-- Warning alert -->
<gc-alert variant="warning" title="Warning">
  Please review your information before proceeding.
</gc-alert>

<!-- Info alert (non-dismissible) -->
<gc-alert variant="info" title="Information">
  This is an informational message.
</gc-alert>
```

**Properties**:
- `variant`: Alert type
- `title`: Optional alert title
- `dismissible`: Boolean - shows close button
- `onDismiss`: EventEmitter<void>

---

#### 5. Loading Spinner (`gc-loading-spinner`)

**File**: `src/app/shared/components/loading-spinner/`

**Variants**: `primary` | `secondary` | `white`
**Sizes**: `sm` | `md` | `lg` | `xl`

```html
<!-- Primary spinner with label -->
<gc-loading-spinner variant="primary" size="md" label="Loading..."></gc-loading-spinner>

<!-- Small spinner without label -->
<gc-loading-spinner variant="primary" size="sm"></gc-loading-spinner>

<!-- Centered spinner -->
<gc-loading-spinner variant="primary" size="lg" label="Please wait..." [centered]="true"></gc-loading-spinner>

<!-- White spinner (for dark backgrounds) -->
<gc-loading-spinner variant="white" size="md" label="Processing..."></gc-loading-spinner>
```

**Properties**:
- `variant`: Spinner color
- `size`: Spinner size
- `label`: Optional loading label
- `centered`: Boolean - centers spinner in container

---

#### 6. Skeleton Loader (`gc-skeleton`)

**File**: `src/app/shared/components/skeleton/`

**Variants**: `text` | `rect` | `circle` | `rounded`

```html
<!-- Text skeleton (for loading text) -->
<gc-skeleton variant="text" width="80%"></gc-skeleton>
<gc-skeleton variant="text" width="60%"></gc-skeleton>

<!-- Rectangle skeleton (for images/boxes) -->
<gc-skeleton variant="rect" width="100%" height="200px"></gc-skeleton>

<!-- Circle skeleton (for avatars) -->
<gc-skeleton variant="circle" width="60px" height="60px"></gc-skeleton>

<!-- Rounded rectangle (for buttons/cards) -->
<gc-skeleton variant="rounded" width="120px" height="40px"></gc-skeleton>

<!-- Multiple skeletons -->
<gc-skeleton variant="text" [count]="3" width="90%"></gc-skeleton>

<!-- Without animation -->
<gc-skeleton variant="text" [animated]="false"></gc-skeleton>
```

**Properties**:
- `variant`: Skeleton shape
- `width`: CSS width value
- `height`: CSS height value
- `count`: Number of skeleton items to display
- `animated`: Boolean - enables shimmer animation (default: true)

---

### Advanced Components

#### 7. Input (`gc-input`)

**File**: `src/app/shared/components/input/`

**Sizes**: `sm` | `md` | `lg`
**States**: `default` | `success` | `warning` | `error`

**ControlValueAccessor**: ✅ Works with Angular forms

```html
<!-- Basic input -->
<gc-input
  type="text"
  label="Full Name"
  placeholder="Enter your name"
  [(ngModel)]="name"
></gc-input>

<!-- Email input with icon -->
<gc-input
  type="email"
  label="Email Address"
  placeholder="you@example.com"
  prefixIcon="✉"
  [required]="true"
  helperText="We'll never share your email"
  [(ngModel)]="email"
></gc-input>

<!-- Password input -->
<gc-input
  type="password"
  label="Password"
  prefixIcon="🔒"
  [required]="true"
  [(ngModel)]="password"
></gc-input>

<!-- Input with validation states -->
<gc-input
  type="text"
  label="Username"
  state="success"
  helperText="Username is available!"
  suffixIcon="✓"
></gc-input>

<gc-input
  type="text"
  label="Email"
  state="error"
  errorText="This email is already taken"
  suffixIcon="✕"
></gc-input>

<!-- Disabled input -->
<gc-input
  type="text"
  label="Read Only"
  [disabled]="true"
  value="Cannot edit this"
></gc-input>

<!-- Reactive Forms -->
<gc-input
  type="text"
  label="Company Name"
  [formControl]="companyControl"
></gc-input>
```

**Properties**:
- `type`: Input type (`text` | `email` | `password` | `number` | `tel` | `url`)
- `size`: Input size
- `state`: Validation state
- `label`: Input label
- `placeholder`: Placeholder text
- `helperText`: Helper text below input
- `errorText`: Error message (shown when state="error")
- `prefixIcon`: Icon before input
- `suffixIcon`: Icon after input
- `disabled`: Boolean
- `required`: Boolean
- `readonly`: Boolean

---

#### 8. Checkbox (`gc-checkbox`)

**File**: `src/app/shared/components/checkbox/`

**Sizes**: `sm` | `md` | `lg`

**ControlValueAccessor**: ✅ Works with Angular forms

```html
<!-- Basic checkbox -->
<gc-checkbox
  label="I agree to the terms and conditions"
  [(ngModel)]="agreedToTerms"
></gc-checkbox>

<!-- Indeterminate state (select all) -->
<gc-checkbox
  label="Select All"
  [indeterminate]="someSelected"
  [(ngModel)]="allSelected"
  (onChange)="handleSelectAll($event)"
></gc-checkbox>

<!-- Disabled checkbox -->
<gc-checkbox
  label="This option is disabled"
  [disabled]="true"
></gc-checkbox>

<!-- Different sizes -->
<gc-checkbox label="Small checkbox" size="sm"></gc-checkbox>
<gc-checkbox label="Medium checkbox" size="md"></gc-checkbox>
<gc-checkbox label="Large checkbox" size="lg"></gc-checkbox>

<!-- Reactive Forms -->
<gc-checkbox
  label="Subscribe to newsletter"
  [formControl]="newsletterControl"
></gc-checkbox>
```

**Properties**:
- `label`: Checkbox label
- `size`: Checkbox size
- `disabled`: Boolean
- `indeterminate`: Boolean - shows indeterminate state
- `onChange`: EventEmitter<boolean>

---

#### 9. Tooltip (`gc-tooltip`)

**File**: `src/app/shared/components/tooltip/`

**Positions**: `top` | `bottom` | `left` | `right`
**Sizes**: `sm` | `md` | `lg`

```html
<!-- Basic tooltip -->
<gc-tooltip text="This is helpful information" position="top">
  <button>Hover me</button>
</gc-tooltip>

<!-- Tooltip with custom delay -->
<gc-tooltip text="Tooltip appears after 500ms" position="right" [delay]="500">
  <span>Hover for delayed tooltip</span>
</gc-tooltip>

<!-- Tooltip with max width -->
<gc-tooltip
  text="This is a longer tooltip with more information that will wrap nicely"
  position="bottom"
  maxWidth="300px"
>
  <button>Long tooltip</button>
</gc-tooltip>

<!-- Different positions -->
<gc-tooltip text="Top tooltip" position="top">
  <button>Top</button>
</gc-tooltip>

<gc-tooltip text="Right tooltip" position="right">
  <button>Right</button>
</gc-tooltip>

<gc-tooltip text="Bottom tooltip" position="bottom">
  <button>Bottom</button>
</gc-tooltip>

<gc-tooltip text="Left tooltip" position="left">
  <button>Left</button>
</gc-tooltip>

<!-- Disabled tooltip -->
<gc-tooltip text="This won't show" position="top" [disabled]="true">
  <button>No tooltip</button>
</gc-tooltip>
```

**Properties**:
- `text`: Tooltip content
- `position`: Tooltip position relative to trigger
- `size`: Tooltip size
- `delay`: Show delay in milliseconds (default: 200)
- `maxWidth`: CSS max-width value (default: '200px')
- `disabled`: Boolean - disables tooltip

---

#### 10. Dropdown (`gc-dropdown`)

**File**: `src/app/shared/components/dropdown/`

**Positions**: `bottom-left` | `bottom-right` | `top-left` | `top-right`
**Sizes**: `sm` | `md` | `lg`

```html
<!-- Basic dropdown -->
<gc-dropdown
  [items]="menuItems"
  triggerText="Actions"
  position="bottom-left"
  (onSelect)="handleSelect($event)"
></gc-dropdown>

<!-- Dropdown with custom trigger -->
<gc-dropdown
  [items]="userMenuItems"
  triggerText="User Menu"
  triggerIcon="▼"
  position="bottom-right"
></gc-dropdown>

<!-- Full width dropdown -->
<gc-dropdown
  [items]="options"
  triggerText="Select an option"
  [fullWidth]="true"
></gc-dropdown>

<!-- Disabled dropdown -->
<gc-dropdown
  [items]="menuItems"
  triggerText="Disabled"
  [disabled]="true"
></gc-dropdown>
```

**Component Setup**:
```typescript
export interface DropdownItem {
  label?: string;
  value?: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

// In component
menuItems: DropdownItem[] = [
  { label: 'Edit', value: 'edit', icon: '✏️' },
  { label: 'Duplicate', value: 'duplicate', icon: '📋' },
  { label: 'Archive', value: 'archive', icon: '📦' },
  { divider: true },  // Divider line
  { label: 'Delete', value: 'delete', icon: '🗑️' }
];

handleSelect(item: DropdownItem) {
  console.log('Selected:', item.value);
}
```

**Properties**:
- `items`: Array of dropdown items
- `position`: Menu position
- `size`: Dropdown size
- `triggerText`: Button text
- `triggerIcon`: Button icon (default: '▼')
- `disabled`: Boolean
- `fullWidth`: Boolean
- `onSelect`: EventEmitter<DropdownItem>

**Features**:
- Click outside to close
- Escape key to close
- Keyboard navigation
- Divider support
- Disabled items

---

#### 11. Empty State (`gc-empty-state`)

**File**: `src/app/shared/components/empty-state/`

**Variants**: `no-data` | `no-results` | `error` | `success` | `info`
**Sizes**: `sm` | `md` | `lg`

```html
<!-- No data state -->
<gc-empty-state
  variant="no-data"
  title="No items yet"
  description="Get started by adding your first item"
  actionText="Add Item"
  actionIcon="+"
  (onAction)="handleAddItem()"
></gc-empty-state>

<!-- No search results -->
<gc-empty-state
  variant="no-results"
  title="No results found"
  description="Try adjusting your search criteria"
  actionText="Clear filters"
  actionIcon="↺"
  (onAction)="clearFilters()"
></gc-empty-state>

<!-- Error state -->
<gc-empty-state
  variant="error"
  title="Something went wrong"
  description="We couldn't load this content"
  actionText="Try again"
  actionIcon="↻"
  (onAction)="retry()"
></gc-empty-state>

<!-- Success state -->
<gc-empty-state
  variant="success"
  title="All done!"
  description="You've completed all tasks"
  size="sm"
></gc-empty-state>

<!-- Custom icon -->
<gc-empty-state
  variant="info"
  icon="🎉"
  title="Welcome!"
  description="Let's get you started"
></gc-empty-state>

<!-- With custom content -->
<gc-empty-state
  variant="no-data"
  title="No messages"
  description="Your inbox is empty"
>
  <p>Custom content can go here</p>
</gc-empty-state>
```

**Properties**:
- `variant`: Empty state type
- `size`: Component size
- `icon`: Custom icon (overrides default variant icon)
- `title`: Main heading
- `description`: Description text
- `actionText`: Button text
- `actionIcon`: Button icon
- `onAction`: EventEmitter<void>

**Default Icons by Variant**:
- `no-data`: 📭
- `no-results`: 🔍
- `error`: ⚠️
- `success`: ✓
- `info`: ℹ️

---

## Utility Classes

Over 100 utility classes are available in `src/styles/_base.scss`.

### Spacing

```html
<!-- Padding -->
<div class="p-4">Padding all sides (16px)</div>
<div class="px-6">Padding horizontal (24px)</div>
<div class="py-3">Padding vertical (12px)</div>
<div class="pt-8">Padding top (32px)</div>

<!-- Margin -->
<div class="m-4">Margin all sides (16px)</div>
<div class="mx-auto">Margin horizontal auto (centering)</div>
<div class="my-6">Margin vertical (24px)</div>
<div class="mb-10">Margin bottom (40px)</div>
```

### Typography

```html
<p class="text-sm">Small text (14px)</p>
<p class="text-base">Base text (16px)</p>
<p class="text-lg">Large text (18px)</p>
<p class="text-2xl">2XL text (24px)</p>

<p class="font-bold">Bold text</p>
<p class="font-medium">Medium weight</p>
<p class="font-semibold">Semibold text</p>

<p class="text-center">Centered text</p>
<p class="text-left">Left-aligned text</p>
<p class="text-right">Right-aligned text</p>
```

### Colors

```html
<!-- Text colors -->
<p class="text-primary">Primary brand color</p>
<p class="text-secondary">Secondary color</p>
<p class="text-success">Success green</p>
<p class="text-error">Error red</p>
<p class="text-neutral-600">Gray text</p>

<!-- Background colors -->
<div class="bg-primary">Primary background</div>
<div class="bg-neutral-100">Light gray background</div>
<div class="bg-white">White background</div>
```

### Layout

```html
<!-- Flexbox -->
<div class="flex">Flex container</div>
<div class="flex items-center">Vertically centered</div>
<div class="flex justify-between">Space between</div>
<div class="flex gap-4">Gap between items</div>

<!-- Grid -->
<div class="grid grid-cols-3">Three column grid</div>
<div class="grid gap-6">Grid with gap</div>

<!-- Display -->
<div class="block">Display block</div>
<div class="hidden">Display none</div>
<div class="inline-block">Inline block</div>
```

### Borders

```html
<div class="border">1px border</div>
<div class="border-2">2px border</div>
<div class="border-primary">Primary border color</div>
<div class="rounded-md">Medium border radius</div>
<div class="rounded-full">Fully rounded</div>
```

### Shadows

```html
<div class="shadow-sm">Small shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
```

### Width

```html
<div class="w-full">100% width</div>
<div class="w-half">50% width</div>
<div class="w-screen">100vw width</div>
```

---

## Usage Examples

### Form with Validation

```html
<form [formGroup]="userForm" (ngSubmit)="onSubmit()">
  <gc-input
    type="text"
    label="Full Name"
    placeholder="Enter your name"
    [formControl]="userForm.controls.name"
    [required]="true"
    [state]="getFieldState('name')"
    [errorText]="getFieldError('name')"
  ></gc-input>

  <gc-input
    type="email"
    label="Email Address"
    placeholder="you@example.com"
    prefixIcon="✉"
    [formControl]="userForm.controls.email"
    [required]="true"
    [state]="getFieldState('email')"
    [errorText]="getFieldError('email')"
  ></gc-input>

  <gc-checkbox
    label="I agree to the terms and conditions"
    [formControl]="userForm.controls.agreeToTerms"
  ></gc-checkbox>

  <div class="flex gap-3">
    <gc-button
      type="submit"
      variant="primary"
      [disabled]="!userForm.valid"
    >
      Submit
    </gc-button>

    <gc-button
      type="button"
      variant="secondary"
      (onClick)="cancel()"
    >
      Cancel
    </gc-button>
  </div>
</form>
```

### Data List with Empty State

```html
<div class="data-container">
  <!-- Loading state -->
  <div *ngIf="isLoading">
    <gc-loading-spinner
      variant="primary"
      size="lg"
      label="Loading items..."
      [centered]="true"
    ></gc-loading-spinner>
  </div>

  <!-- Empty state -->
  <gc-empty-state
    *ngIf="!isLoading && items.length === 0"
    variant="no-data"
    title="No items yet"
    description="Get started by adding your first item"
    actionText="Add Item"
    actionIcon="+"
    (onAction)="addItem()"
  ></gc-empty-state>

  <!-- Data grid -->
  <div *ngIf="!isLoading && items.length > 0" class="grid grid-cols-3 gap-4">
    <gc-card
      *ngFor="let item of items"
      variant="elevated"
      padding="md"
      [hoverable]="true"
      [clickable]="true"
      (click)="viewItem(item)"
    >
      <h3>{{ item.name }}</h3>
      <p>{{ item.description }}</p>
      <div class="flex gap-2">
        <gc-badge variant="primary">{{ item.category }}</gc-badge>
        <gc-badge variant="success" *ngIf="item.isActive">Active</gc-badge>
      </div>
    </gc-card>
  </div>
</div>
```

### Alert System

```html
<div class="alerts-container">
  <gc-alert
    *ngIf="successMessage"
    variant="success"
    title="Success!"
    [dismissible]="true"
    (onDismiss)="clearSuccessMessage()"
  >
    {{ successMessage }}
  </gc-alert>

  <gc-alert
    *ngIf="errorMessage"
    variant="error"
    title="Error"
    [dismissible]="true"
    (onDismiss)="clearErrorMessage()"
  >
    {{ errorMessage }}
  </gc-alert>

  <gc-alert
    *ngIf="warningMessage"
    variant="warning"
    title="Warning"
    [dismissible]="true"
    (onDismiss)="clearWarningMessage()"
  >
    {{ warningMessage }}
  </gc-alert>
</div>
```

---

## Best Practices

### 1. Always Use Design Tokens

**✅ DO:**
```scss
.component {
  color: var(--neutral-900);
  background: var(--brand-primary-700);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
```

**❌ DON'T:**
```scss
.component {
  color: #111827;
  background: #0080C0;
  padding: 16px;
  border-radius: 10px;
}
```

### 2. Use Utility Classes for Common Patterns

**✅ DO:**
```html
<div class="flex items-center gap-4 p-6 bg-white rounded-lg shadow-md">
  <!-- Content -->
</div>
```

**❌ DON'T:**
```html
<div class="custom-container">
  <!-- Content -->
</div>

<style>
.custom-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
```

### 3. Component Composition

Prefer composing existing components over creating new ones:

```html
<!-- Good: Compose existing components -->
<gc-card variant="elevated" padding="md">
  <div class="flex items-center justify-between mb-4">
    <h3>User Profile</h3>
    <gc-badge variant="success">Active</gc-badge>
  </div>

  <gc-input
    type="text"
    label="Name"
    [(ngModel)]="userName"
  ></gc-input>

  <div class="flex gap-3 mt-6">
    <gc-button variant="primary">Save</gc-button>
    <gc-button variant="secondary">Cancel</gc-button>
  </div>
</gc-card>
```

### 4. Accessibility

All components include accessibility features:
- Keyboard navigation
- ARIA attributes
- Focus states
- Reduced motion support

Always maintain these when using components:

```html
<!-- Good: Maintains accessibility -->
<gc-button variant="primary" type="submit">
  Submit Form
</gc-button>

<!-- Good: Proper label association -->
<gc-input
  type="email"
  label="Email Address"
  [required]="true"
></gc-input>
```

### 5. Performance

Use appropriate loading patterns:

```html
<!-- Skeleton for anticipated content -->
<div *ngIf="isLoading">
  <gc-skeleton variant="text" [count]="3"></gc-skeleton>
  <gc-skeleton variant="rect" height="200px"></gc-skeleton>
</div>

<!-- Spinner for indeterminate operations -->
<div *ngIf="isProcessing">
  <gc-loading-spinner variant="primary" label="Processing..."></gc-loading-spinner>
</div>
```

---

## Component Migration Guide

### Updating Existing Code

When migrating existing components to use the design system:

1. **Replace hardcoded colors with tokens**:
   ```scss
   // Before
   color: #0080C0;

   // After
   color: var(--brand-primary-700);
   ```

2. **Replace custom buttons with gc-button**:
   ```html
   <!-- Before -->
   <button class="btn-primary" (click)="save()">Save</button>

   <!-- After -->
   <gc-button variant="primary" (onClick)="save()">Save</gc-button>
   ```

3. **Replace custom cards with gc-card**:
   ```html
   <!-- Before -->
   <div class="card">
     <h3>Title</h3>
     <p>Content</p>
   </div>

   <!-- After -->
   <gc-card variant="elevated" padding="md">
     <h3>Title</h3>
     <p>Content</p>
   </gc-card>
   ```

4. **Add proper loading states**:
   ```html
   <!-- Before -->
   <div *ngIf="isLoading">Loading...</div>

   <!-- After -->
   <gc-loading-spinner
     *ngIf="isLoading"
     variant="primary"
     label="Loading..."
   ></gc-loading-spinner>
   ```

---

## Support

For questions or issues with the design system:
- View the live showcase at `/design-system`
- Check component source code in `src/app/shared/components/`
- Review design tokens in `src/styles/_design-tokens.scss`
- See utility classes in `src/styles/_base.scss`

---

**Version**: 1.0.0
**Last Updated**: January 2026
**Author**: GadgetCloud Development Team
