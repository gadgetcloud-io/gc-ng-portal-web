import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal';
import { TabsComponent, Tab } from '../tabs/tabs.component';
import { ButtonComponent } from '../button/button';
import { HelpService, SupportRequestData, FeedbackData } from '../../../core/services/help.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'gc-help-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    TabsComponent,
    ButtonComponent
  ],
  templateUrl: './help-dialog.html',
  styleUrl: './help-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpDialogComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  // Tab configuration
  tabs: Tab[] = [
    { id: 'support', label: 'Contact us', icon: '✉️' },
    { id: 'feedback', label: 'Feedback', icon: '💬' }
  ];
  activeTabId = 'support';

  // Form data
  supportForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  feedbackForm = {
    name: '',
    email: '',
    category: '',
    message: ''
  };

  // State management
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';
  ticketId = '';

  constructor(
    private helpService: HelpService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.preFillUserData();
  }

  /**
   * Pre-fill name and email if user is logged in
   */
  private preFillUserData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.supportForm.name = `${currentUser.firstName} ${currentUser.lastName}`.trim();
      this.supportForm.email = currentUser.email;
      this.feedbackForm.name = `${currentUser.firstName} ${currentUser.lastName}`.trim();
      this.feedbackForm.email = currentUser.email;
      this.cdr.markForCheck();
    }
  }

  onTabChange(tabId: string): void {
    this.activeTabId = tabId;
    this.resetMessages();
    this.cdr.markForCheck();
  }

  submitSupportRequest(): void {
    // Validate form
    const validationError = this.validateSupportRequest();
    if (validationError) {
      this.errorMessage = validationError;
      this.submitError = true;
      this.cdr.markForCheck();
      return;
    }

    // Submit to API
    this.isSubmitting = true;
    this.submitError = false;
    this.submitSuccess = false;
    this.cdr.markForCheck();

    const formData: SupportRequestData = {
      name: this.supportForm.name.trim(),
      email: this.supportForm.email.trim(),
      subject: this.supportForm.subject.trim(),
      message: this.supportForm.message.trim()
    };

    this.helpService.submitSupportRequest(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.ticketId = response.id;
        this.resetSupportForm();
        this.cdr.markForCheck();

        // Auto-hide success message after 10 seconds
        setTimeout(() => {
          this.submitSuccess = false;
          this.cdr.markForCheck();
        }, 10000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.submitError = true;
        // Extract error from FastAPI response
        this.errorMessage = error.message || 'Failed to submit support request. Please try again.';
        console.error('Support request submission error:', error);
        this.cdr.markForCheck();

        // Auto-hide error message after 10 seconds
        setTimeout(() => {
          this.submitError = false;
          this.cdr.markForCheck();
        }, 10000);
      }
    });
  }

  submitFeedback(): void {
    // Validate form
    const validationError = this.validateFeedback();
    if (validationError) {
      this.errorMessage = validationError;
      this.submitError = true;
      this.cdr.markForCheck();
      return;
    }

    // Submit to API
    this.isSubmitting = true;
    this.submitError = false;
    this.submitSuccess = false;
    this.cdr.markForCheck();

    const formData: FeedbackData = {
      name: this.feedbackForm.name.trim(),
      email: this.feedbackForm.email.trim(),
      category: this.feedbackForm.category,
      message: this.feedbackForm.message.trim()
    };

    this.helpService.submitFeedback(formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.ticketId = response.id;
        this.resetFeedbackForm();
        this.cdr.markForCheck();

        // Auto-hide success message after 10 seconds
        setTimeout(() => {
          this.submitSuccess = false;
          this.cdr.markForCheck();
        }, 10000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.submitError = true;
        // Extract error from FastAPI response
        this.errorMessage = error.message || 'Failed to submit feedback. Please try again.';
        console.error('Feedback submission error:', error);
        this.cdr.markForCheck();

        // Auto-hide error message after 10 seconds
        setTimeout(() => {
          this.submitError = false;
          this.cdr.markForCheck();
        }, 10000);
      }
    });
  }

  validateSupportRequest(): string | null {
    const { name, email, subject, message } = this.supportForm;

    if (!name || name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (name.trim().length > 100) {
      return 'Name must be less than 100 characters';
    }

    if (!email || !this.isValidEmail(email)) {
      return 'Please enter a valid email address';
    }

    if (!subject || subject.trim().length < 5) {
      return 'Subject must be at least 5 characters';
    }
    if (subject.trim().length > 200) {
      return 'Subject must be less than 200 characters';
    }

    if (!message || message.trim().length < 20) {
      return 'Message must be at least 20 characters';
    }
    if (message.trim().length > 2000) {
      return 'Message must be less than 2000 characters';
    }

    return null;
  }

  validateFeedback(): string | null {
    const { name, email, message } = this.feedbackForm;

    if (!name || name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (name.trim().length > 100) {
      return 'Name must be less than 100 characters';
    }

    if (!email || !this.isValidEmail(email)) {
      return 'Please enter a valid email address';
    }

    if (!message || message.trim().length < 20) {
      return 'Message must be at least 20 characters';
    }
    if (message.trim().length > 2000) {
      return 'Message must be less than 2000 characters';
    }

    return null;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onClose(): void {
    this.resetForms();
    this.resetMessages();
    this.activeTabId = 'support';
    this.close.emit();
  }

  resetForms(): void {
    this.resetSupportForm();
    this.resetFeedbackForm();
  }

  resetSupportForm(): void {
    this.supportForm = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
    // Re-fill user data if logged in
    this.preFillUserData();
  }

  resetFeedbackForm(): void {
    this.feedbackForm = {
      name: '',
      email: '',
      category: '',
      message: ''
    };
    // Re-fill user data if logged in
    this.preFillUserData();
  }

  resetMessages(): void {
    this.submitSuccess = false;
    this.submitError = false;
    this.errorMessage = '';
    this.ticketId = '';
  }
}
