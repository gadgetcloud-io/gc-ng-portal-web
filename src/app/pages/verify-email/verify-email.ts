import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss'
})
export class VerifyEmailComponent implements OnInit {
  // Token from URL
  token = '';

  // Validation state
  isValidating = true;
  isValid = false;
  userEmail = '';

  // Resend state
  isResending = false;
  resendSuccess = false;
  resendError = '';

  // UI state
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
        this.isValidating = false;
        this.errorMessage = 'No verification token provided';
        return;
      }

      // Verify token
      this.verifyToken();
    });
  }

  verifyToken(): void {
    this.authService.verifyEmail(this.token).subscribe({
      next: (response) => {
        this.isValidating = false;
        if (response.success) {
          this.isValid = true;
          this.userEmail = response.email || '';

          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        } else {
          this.errorMessage = response.error || 'Invalid or expired verification link';
        }
      },
      error: (error) => {
        this.isValidating = false;
        this.errorMessage = 'An error occurred during verification';
        console.error('Verification error:', error);
      }
    });
  }

  onResendVerification(): void {
    if (!this.userEmail) {
      return;
    }

    this.isResending = true;
    this.resendError = '';
    this.resendSuccess = false;

    this.authService.resendVerification(this.userEmail).subscribe({
      next: (response) => {
        this.isResending = false;
        if (response.success) {
          this.resendSuccess = true;
        } else {
          this.resendError = response.error || 'Failed to resend verification email';
        }
      },
      error: (error) => {
        this.isResending = false;
        this.resendError = 'An error occurred. Please try again.';
        console.error('Resend error:', error);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
