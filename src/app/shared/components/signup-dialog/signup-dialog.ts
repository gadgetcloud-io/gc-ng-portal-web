import { Component, EventEmitter, Input, Output } from '@angular/core';
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
  styleUrl: './signup-dialog.scss'
})
export class SignupDialogComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() switchToLogin = new EventEmitter<void>();
  @Output() signupSuccess = new EventEmitter<void>();

  formData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  };

  isLoading = false;
  errorMessage = '';

  constructor(private authService: AuthService) {}

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
      return;
    }

    // Validate password length
    if (this.formData.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters';
      return;
    }

    // Validate terms agreement
    if (!this.formData.agreeToTerms) {
      this.errorMessage = 'Please agree to the Terms of Service and Privacy Policy';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.signup(
      this.formData.name,
      this.formData.email,
      this.formData.password
    ).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.signupSuccess.emit();
          this.onClose();
        } else {
          this.errorMessage = result.error || 'Signup failed. Please try again.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred. Please try again.';
        console.error('Signup error:', error);
      }
    });
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    };
    this.errorMessage = '';
  }
}
