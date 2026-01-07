import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'gc-signup-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './signup-dialog.html',
  styleUrl: './signup-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();
  @Output() signupSuccess = new EventEmitter<void>();

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onSwitchToLogin(): void {
    this.switchToLogin.emit();
    this.resetForm();
  }

  onSubmit(): void {
    // Validate passwords match
    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      this.cdr.markForCheck();
      return;
    }

    // Validate password length
    if (this.formData.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters';
      this.cdr.markForCheck();
      return;
    }

    // Validate terms agreement
    if (!this.formData.agreeToTerms) {
      this.errorMessage = 'Please agree to the Terms of Service and Privacy Policy';
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.authService.signup(
      this.formData.firstName,
      this.formData.lastName,
      this.formData.email,
      this.formData.password
    ).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          // Show success message instead of closing
          this.successMessage = result.message || 'Account created! Please check your email to verify your account.';
          // Don't emit signupSuccess or close dialog yet
          // User reads message, then clicks close or we auto-close after delay
          setTimeout(() => {
            this.resetForm();
            this.signupSuccess.emit();  // This closes the dialog via parent
          }, 5000);  // 5 seconds to read message
        } else {
          this.errorMessage = result.error || 'Signup failed. Please try again.';
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred. Please try again.';
        console.error('Signup error:', error);
        this.cdr.markForCheck();
      }
    });
  }

  private resetForm(): void {
    this.formData = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    };
    this.errorMessage = '';
  }
}
