import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ButtonComponent
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;

  // Inline edit state management (following device-detail pattern)
  editMode: { [key: string]: boolean } = {};
  editValues: { [key: string]: any } = {};
  isUpdating: { [key: string]: boolean } = {};
  fieldErrors: { [key: string]: string } = {};

  // Password edit state
  passwordEditMode = false;
  passwordValues = {
    current: '',
    new: '',
    confirm: ''
  };

  // Success/error messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  private subscriptions = new Subscription();
  private destroy$ = new Subject<void>();
  private dismissMessage$ = new Subject<void>();

  userInfo = {
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    role: 'Free User',
    avatar: '',
    joinDate: 'January 2025'
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();

    if (!this.user) {
      // Redirect to home if not authenticated
      this.router.navigate(['/']);
      return;
    }

    // Use user data
    this.userInfo.firstName = this.user.firstName;
    this.userInfo.lastName = this.user.lastName;
    this.userInfo.email = this.user.email;
    this.userInfo.mobile = this.user.mobile || '';
    this.userInfo.avatar = this.user.firstName.charAt(0).toUpperCase();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTwoFactor(): void {
    console.log('Toggle 2FA clicked');
  }

  // Inline edit methods (following device-detail pattern)
  enterEditMode(field: string): void {
    this.editValues[field] = this.userInfo[field as keyof typeof this.userInfo];
    this.editMode[field] = true;
    this.fieldErrors[field] = '';
    this.cdr.markForCheck();
  }

  onFieldChange(): void {
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }

  saveField(field: string): void {
    const newValue = this.editValues[field];
    const oldValue = this.userInfo[field as keyof typeof this.userInfo];

    // Check if value changed
    if (newValue === oldValue) {
      this.cancelEdit(field);
      return;
    }

    // Validate field
    const validationError = this.validateField(field, newValue);
    if (validationError) {
      this.fieldErrors[field] = validationError;
      this.cdr.markForCheck();
      return;
    }

    // Optimistic update: Update UI immediately
    (this.userInfo as any)[field] = newValue;
    this.cancelEdit(field);
    this.cdr.markForCheck();

    // Generate reason for audit log
    const reason = `User updated their ${this.formatFieldName(field).toLowerCase()}`;

    // Call RBAC API to update profile field in background
    this.authService.updateProfileField(field, newValue, reason).subscribe({
      next: (result) => {
        if (result.success && result.user) {
          // Success: show success message
          this.showSuccessMessage(`${this.formatFieldName(field)} updated successfully`);
        } else {
          // Failed: rollback to old value and show error
          (this.userInfo as any)[field] = oldValue;
          this.showErrorMessage(result.error || 'Update failed');
        }
      },
      error: (error) => {
        // Error: rollback to old value and show error
        (this.userInfo as any)[field] = oldValue;
        this.showErrorMessage('An error occurred. Please try again.');
        console.error('Profile update error:', error);
      }
    });
  }

  cancelEdit(field: string): void {
    delete this.editMode[field];
    delete this.editValues[field];
    delete this.fieldErrors[field];
    delete this.isUpdating[field];
    this.cdr.markForCheck();
  }

  validateField(field: string, value: any): string | null {
    // First name / Last name validation
    if (field === 'firstName' || field === 'lastName') {
      if (!value || value.trim().length === 0) {
        return `${this.formatFieldName(field)} is required`;
      }
      if (value.trim().length < 2) {
        return `${this.formatFieldName(field)} must be at least 2 characters`;
      }
      if (value.trim().length > 50) {
        return `${this.formatFieldName(field)} must be less than 50 characters`;
      }
    }

    // Mobile validation (optional field)
    if (field === 'mobile') {
      if (value && value.trim().length > 0) {
        // Basic phone format validation
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value)) {
          return 'Please enter a valid phone number';
        }
      }
    }

    return null;
  }

  formatFieldName(field: string): string {
    // Convert camelCase to "Field Name"
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  // Password edit methods
  enterPasswordEditMode(): void {
    this.passwordEditMode = true;
    this.passwordValues = {
      current: '',
      new: '',
      confirm: ''
    };
    this.fieldErrors['password'] = '';
    this.cdr.markForCheck();
  }

  savePassword(): void {
    // Validate password fields
    const validationError = this.validatePassword();
    if (validationError) {
      this.fieldErrors['password'] = validationError;
      this.cdr.markForCheck();
      return;
    }

    // Clear error
    this.fieldErrors['password'] = '';
    this.isUpdating['password'] = true;
    this.cdr.markForCheck();

    // Call API to change password
    this.authService.changePassword(
      this.passwordValues.current,
      this.passwordValues.new
    ).subscribe({
      next: (result) => {
        this.isUpdating['password'] = false;
        if (result.success) {
          this.cancelPasswordEdit();
          this.showSuccessMessage('Password updated successfully');
        } else {
          this.fieldErrors['password'] = result.error || 'Failed to change password';
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isUpdating['password'] = false;
        this.fieldErrors['password'] = 'An error occurred. Please try again.';
        console.error('Password change error:', error);
        this.cdr.markForCheck();
      }
    });
  }

  cancelPasswordEdit(): void {
    this.passwordEditMode = false;
    this.passwordValues = {
      current: '',
      new: '',
      confirm: ''
    };
    delete this.fieldErrors['password'];
    delete this.isUpdating['password'];
    this.cdr.markForCheck();
  }

  validatePassword(): string | null {
    const { current, new: newPassword, confirm } = this.passwordValues;

    if (!current || current.trim().length === 0) {
      return 'Current password is required';
    }

    if (!newPassword || newPassword.trim().length === 0) {
      return 'New password is required';
    }

    if (newPassword.length < 8) {
      return 'New password must be at least 8 characters';
    }

    if (current === newPassword) {
      return 'New password must be different from current password';
    }

    if (newPassword !== confirm) {
      return 'New password and confirm password do not match';
    }

    return null;
  }

  // Success message helper
  showSuccessMessage(message: string): void {
    // Cancel any existing timer
    this.dismissMessage$.next();

    this.successMessage = message;
    this.errorMessage = null;
    this.cdr.markForCheck();

    // Auto-dismiss after 3 seconds using RxJS timer
    timer(3000)
      .pipe(
        takeUntil(this.dismissMessage$),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.successMessage = null;
        this.cdr.markForCheck();
      });
  }

  // Error message helper
  showErrorMessage(message: string): void {
    // Cancel any existing timer
    this.dismissMessage$.next();

    this.errorMessage = message;
    this.successMessage = null;
    this.cdr.markForCheck();

    // Auto-dismiss after 5 seconds using RxJS timer (longer than success)
    timer(5000)
      .pipe(
        takeUntil(this.dismissMessage$),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.errorMessage = null;
        this.cdr.markForCheck();
      });
  }
}
