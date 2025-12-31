# Shared Styles Guide

This directory contains **decoupled, reusable SCSS modules** that should be used across the entire application. Component-level `.scss` files should be **minimal** and only contain component-specific overrides.

## 📁 Available Shared Styles

### 1. `_design-tokens.scss`
Core design system tokens (colors, spacing, typography, shadows, etc.)

**Usage:**
```scss
@import '../../../styles/design-tokens';

.my-component {
  color: var(--brand-blue-600);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
```

### 2. `_base.scss`
Base styles and resets

**Usage:**
```scss
@import '../../../styles/base';
```

### 3. `_dialog-forms.scss` ⭐ **Use This for All Forms!**
Complete form styling system for dialogs and pages

**Includes:**
- Form inputs (text, select, textarea)
- Form groups and layouts
- Error messages and validation states
- Input groups (e.g., price with $ prefix)
- Form actions (button rows)
- Responsive grid layouts
- Animations

**Usage:**
```scss
// In your component SCSS file:
@import '../../../styles/dialog-forms';

// Now use these classes in your HTML:
// - .device-form
// - .form-group
// - .form-label
// - .form-input
// - .form-row
// - .form-actions
// - .error-message
```

**HTML Example:**
```html
<form class="device-form">
  <div class="form-group">
    <label class="form-label">Device Name *</label>
    <input type="text" class="form-input" placeholder="Enter name" />
    <span class="error-text">This field is required</span>
  </div>

  <div class="form-row">
    <div class="form-group">
      <label class="form-label">Category</label>
      <select class="form-input">
        <option>Select...</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">Price</label>
      <div class="input-group">
        <span class="input-prefix">$</span>
        <input type="number" class="form-input" />
      </div>
    </div>
  </div>

  <div class="form-actions">
    <button type="button">Cancel</button>
    <button type="submit">Save</button>
  </div>
</form>
```

### 4. `_stepper.scss` ⭐ **Use This for Multi-Step Forms!**
Stepper component for multi-step forms/wizards

**Includes:**
- Stepper progress indicator
- Step circles with numbers/checkmarks
- Active/completed states
- Step labels
- Connecting lines
- Smooth animations

**Usage:**
```scss
// In your component SCSS file:
@import '../../../styles/dialog-forms';
@import '../../../styles/stepper';
```

**HTML Example:**
```html
<div class="stepper">
  <div class="step" [class.active]="currentStep === 1" [class.completed]="currentStep > 1">
    <div class="step-circle">
      <span *ngIf="currentStep <= 1" class="step-number">1</span>
      <span *ngIf="currentStep > 1" class="step-check">✓</span>
    </div>
    <div class="step-label">Basic Info</div>
  </div>
  <!-- More steps... -->
</div>

<form class="device-form">
  <div *ngIf="currentStep === 1" class="form-step">
    <!-- Step 1 fields -->
  </div>
  <div *ngIf="currentStep === 2" class="form-step">
    <!-- Step 2 fields -->
  </div>
</form>
```

## 🎯 Best Practices

### ✅ DO:
1. **Import shared styles instead of duplicating**
   ```scss
   // ✅ Good
   @import '../../../styles/dialog-forms';
   ```

2. **Use minimal component-level styles**
   ```scss
   // ✅ Good - component-specific only
   @import '../../../styles/dialog-forms';

   .my-special-button {
     // Only override if absolutely necessary
     background: custom-gradient();
   }
   ```

3. **Follow the class naming conventions**
   - Use existing classes from shared styles
   - `.form-*` for form elements
   - `.step-*` for stepper elements
   - `.error-*` for errors

### ❌ DON'T:
1. **Don't duplicate form styles**
   ```scss
   // ❌ Bad - duplicating shared styles
   .form-input {
     padding: 0.75rem;
     border: 1px solid #ccc;
     // ... (already in dialog-forms.scss!)
   }
   ```

2. **Don't create component-specific form classes**
   ```scss
   // ❌ Bad - use shared classes instead
   .my-custom-input {
     // This should use .form-input from shared styles
   }
   ```

3. **Don't override unless necessary**
   ```scss
   // ❌ Bad - unnecessary override
   .form-input {
     border-radius: 4px; // Already set in shared styles
   }
   ```

## 📋 Migration Checklist

When creating a new component with forms:

- [ ] Import `_dialog-forms.scss` instead of writing form styles
- [ ] Use `.form-group`, `.form-label`, `.form-input` classes
- [ ] Import `_stepper.scss` if using multi-step form
- [ ] Keep component `.scss` file **under 20 lines** if possible
- [ ] Only add component-specific overrides if absolutely needed

## 🔄 Example Migrations

### Before (❌ 150 lines of duplicated styles):
```scss
// my-component.scss
.form-container {
  padding: 20px;
}

.form-group {
  margin-bottom: 1rem;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    // ... 100 more lines
  }

  input {
    width: 100%;
    padding: 0.75rem;
    // ... 50 more lines
  }
}
```

### After (✅ 3 lines):
```scss
// my-component.scss
@import '../../../styles/dialog-forms';
```

## 📊 Benefits

- **Consistency**: Same look and feel across all forms
- **Maintainability**: Update once, applies everywhere
- **Bundle Size**: Smaller CSS files (no duplication)
- **Development Speed**: No need to write form CSS
- **Accessibility**: Shared styles include proper focus states
- **Responsiveness**: Mobile-friendly by default

## 🆘 Need Help?

If you need a style that doesn't exist in shared files:
1. Check if it's truly component-specific or could be shared
2. If shared, add it to the appropriate shared file
3. If truly component-specific, add minimal override in component file
4. Document why the override is necessary

---

**Remember**: The goal is **minimal component-level SCSS, maximum shared styles usage**. This keeps the codebase clean, consistent, and maintainable!
