import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button';
import { SeoService } from '../../core/services/seo.service';
import { SEO_CONFIG } from '../../core/config/seo-metadata.config';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { ContactFormService } from '../../core/services/contact-form.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, ScrollRevealDirective],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactComponent implements OnInit {
  isSubmitting = false;
  submitSuccess = false;
  submitError = false;
  errorMessage = '';
  ticketId = '';

  constructor(
    private seoService: SeoService,
    private contactFormService: ContactFormService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.updateSEO();
  }

  private updateSEO(): void {
    const breadcrumbSchema = this.seoService.createBreadcrumbSchema([
      { name: 'Home', url: 'https://www.gadgetcloud.io' },
      { name: 'Contact' }
    ]);

    const faqSchema = this.seoService.createFAQSchema(
      this.faqs.map(faq => ({
        question: faq.question,
        answer: faq.answer
      }))
    );

    const organizationSchema = this.seoService.createOrganizationSchema();

    this.seoService.updateMetadata({
      ...SEO_CONFIG['contact'],
      structuredData: [breadcrumbSchema, faqSchema, organizationSchema]
    });
  }

  contactInfo = {
    email: 'hello@gadgetcloud.io',
    phone: '+91 (555) 123-4567',
    address: 'Kakinada, Andhra Pradesh, India',
    hours: 'Monday - Friday: 9:00 AM - 6:00 PM IST'
  };

  contactMethods = [
    {
      icon: '✉️',
      title: 'Email Us',
      description: 'Get a response within 24 hours',
      action: 'hello@gadgetcloud.io',
      link: 'mailto:hello@gadgetcloud.io'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: 'Start Chat',
      link: '#'
    },
    {
      icon: '📚',
      title: 'Help Center',
      description: 'Browse our knowledge base',
      action: 'View Articles',
      link: '/help'
    }
  ];

  faqs = [
    {
      question: 'How do I get started with GadgetCloud?',
      answer: 'Simply sign up for a free account, add your first device, and start tracking warranties and documents. Our onboarding guide will walk you through the process.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes! We use bank-level encryption (AES-256) to protect your data. All documents are stored securely, and we never share your information with third parties.'
    },
    {
      question: 'What devices can I track?',
      answer: 'You can track any gadget—smartphones, laptops, tablets, cameras, appliances, and more. If it has a warranty or service history, you can manage it in GadgetCloud.'
    },
    {
      question: 'Can I use GadgetCloud for my business?',
      answer: 'Absolutely! Our team collaboration features are perfect for businesses managing multiple devices. Contact us for volume pricing and enterprise features.'
    }
  ];

  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  submitForm(): void {
    // Reset states
    this.submitSuccess = false;
    this.submitError = false;
    this.errorMessage = '';
    this.isSubmitting = true;

    // Submit form via API
    this.contactFormService.submitContactForm(this.formData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.ticketId = response.id;

        // Reset form after successful submission
        this.formData = { name: '', email: '', subject: '', message: '' };

        // Manually trigger change detection
        this.cdr.detectChanges();

        // Auto-hide success message after 10 seconds
        setTimeout(() => {
          this.submitSuccess = false;
          this.cdr.detectChanges();
        }, 10000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.submitError = true;

        // Extract error message
        if (error.error?.detail) {
          // Handle FastAPI validation errors
          if (Array.isArray(error.error.detail)) {
            this.errorMessage = error.error.detail.map((e: any) => e.msg).join(', ');
          } else {
            this.errorMessage = error.error.detail;
          }
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Failed to submit your message. Please try again or email us directly at hello@gadgetcloud.io';
        }

        // Manually trigger change detection
        this.cdr.detectChanges();

        // Auto-hide error message after 10 seconds
        setTimeout(() => {
          this.submitError = false;
          this.cdr.detectChanges();
        }, 10000);
      }
    });
  }
}
