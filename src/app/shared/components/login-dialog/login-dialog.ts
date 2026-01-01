import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
        this.errorMessage = 'An error occurred. Please try again.';
        console.error('Login error:', error);
        this.cdr.markForCheck();
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
