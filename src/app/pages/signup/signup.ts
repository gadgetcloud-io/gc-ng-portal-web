import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupComponent {
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
  redirectCountdown = 5;
  private countdownInterval?: number;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

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
          this.successMessage = result.message || 'Account created! Please check your email to verify your account.';
          this.cdr.markForCheck();

          // Start countdown to redirect to login
          this.startRedirectCountdown();
        } else {
          this.errorMessage = result.error || 'Signup failed. Please try again.';
          this.cdr.markForCheck();
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred. Please try again.';
        console.error('Signup error:', error);
        this.cdr.markForCheck();
      }
    });
  }

  private startRedirectCountdown(): void {
    this.redirectCountdown = 5;
    this.countdownInterval = window.setInterval(() => {
      this.redirectCountdown--;
      this.cdr.markForCheck();

      if (this.redirectCountdown <= 0) {
        this.stopCountdown();
        this.router.navigate(['/login']);
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }
}
