import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { ButtonComponent } from '../button/button';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'gc-login-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ButtonComponent],
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.scss'
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

  constructor(private authService: AuthService) {}

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

    this.authService.login(this.formData.email, this.formData.password).subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.success) {
          this.resetForm();
          this.loginSuccess.emit();
          // Don't call onClose() here - let parent component handle closing
        } else {
          this.errorMessage = result.error || 'Login failed. Please try again.';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred. Please try again.';
        console.error('Login error:', error);
      }
    });
  }

  onForgotPassword(): void {
    alert('Password reset functionality will be implemented.');
  }

  private resetForm(): void {
    this.formData = {
      email: '',
      password: '',
      rememberMe: false
    };
    this.errorMessage = '';
  }
}
