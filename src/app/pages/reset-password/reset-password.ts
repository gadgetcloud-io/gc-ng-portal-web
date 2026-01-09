import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent implements OnInit {
  // Token from URL
  token = '';

  // Validation state
  isValidatingToken = true;
  isTokenValid = false;
  userEmail = '';

  // Form state
  newPassword = '';
  confirmPassword = '';
  isSubmitting = false;

  // UI state
  showSuccess = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Extract token from query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';

      if (!this.token) {
        this.isValidatingToken = false;
        this.errorMessage = 'No reset token provided';
        return;
      }

      // Validate token
      this.validateToken();
    });
  }

  validateToken(): void {
    this.authService.validateResetToken(this.token).subscribe({
      next: (response) => {
        this.isValidatingToken = false;
        if (response.valid) {
          this.isTokenValid = true;
          this.userEmail = response.email || '';
        } else {
          this.errorMessage = 'Invalid or expired reset token';
        }
      },
      error: (error) => {
        this.isValidatingToken = false;
        this.errorMessage = 'Invalid or expired reset token';
        console.error('Token validation error:', error);
      }
    });
  }

  onSubmit(): void {
    // Reset states
    this.errorMessage = '';

    // Validate passwords
    if (!this.newPassword || this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    // Call API
    this.isSubmitting = true;
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.showSuccess = true;
          // Redirect to login page after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.errorMessage = response.error || 'An error occurred. Please try again.';
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'An error occurred. Please try again.';
        console.error('Reset password error:', error);
      }
    });
  }

  backToSignIn(): void {
    this.router.navigate(['/login']);
  }
}
