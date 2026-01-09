import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
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

  onSubmit(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.showResendLink = false;
    this.cdr.markForCheck();

    this.authService.login(this.formData.email, this.formData.password).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          // Get stored redirect URL or default to dashboard
          const redirectUrl = localStorage.getItem('gc_redirect_url') || '/dashboard';
          localStorage.removeItem('gc_redirect_url');
          this.router.navigate([redirectUrl]);
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
}
