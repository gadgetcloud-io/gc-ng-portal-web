import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'gc-login-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() switchToSignup = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<void>();

  formData = {
    email: '',
    password: '',
    rememberMe: false
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showResendLink = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onSwitchToSignup(): void {
    this.switchToSignup.emit();
    this.resetForm();
  }

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.showResendLink = false;
    this.cdr.markForCheck();

    this.authService.login(this.formData.email, this.formData.password).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.resetForm();
          this.loginSuccess.emit();
        } else {
          this.errorMessage = result.error || 'Login failed. Please try again.';
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;

        // Check for specific error codes
        if (error.status === 403) {
          // Email not verified
          this.errorMessage = error.error?.detail || 'Email not verified. Please check your email and verify your account.';
          // Show resend link
          this.showResendLink = true;
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }

        console.error('Login error:', error);
        this.cdr.markForCheck();
      }
    });
  }

  onForgotPassword(): void {
    this.close.emit();
    this.router.navigate(['/forgot-password']);
  }

  onResendVerification(): void {
    if (!this.formData.email) {
      return;
    }

    this.authService.resendVerification(this.formData.email).subscribe({
      next: (response) => {
        if (response.success) {
          this.errorMessage = '';
          this.showResendLink = false;
          this.successMessage = 'Verification email sent! Please check your inbox.';
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        console.error('Resend error:', error);
      }
    });
  }

  private resetForm(): void {
    this.formData = {
      email: '',
      password: '',
      rememberMe: false
    };
    this.errorMessage = '';
    this.successMessage = '';
    this.showResendLink = false;
  }
}
