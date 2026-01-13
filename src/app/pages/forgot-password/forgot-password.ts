import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  showSuccess = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  onSubmit(): void {
    // Reset states
    this.showSuccess = false;
    this.errorMessage = '';

    // Validate email
    if (!this.email || !this.isValidEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    // Call API
    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        // Run inside NgZone to ensure change detection
        this.ngZone.run(() => {
          this.isLoading = false;
          if (response.success) {
            this.showSuccess = true;
            this.email = ''; // Clear input
          } else {
            this.errorMessage = response.error || 'An error occurred. Please try again.';
          }
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        console.error('Forgot password error:', error);
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = 'An error occurred. Please try again.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  backToSignIn(): void {
    this.router.navigate(['/login']);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
