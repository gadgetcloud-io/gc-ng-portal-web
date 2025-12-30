import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactComponent {
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
    console.log('Form submitted:', this.formData);
    // Handle form submission
    alert('Thank you for contacting us! We\'ll get back to you within 24 hours.');
    this.formData = { name: '', email: '', subject: '', message: '' };
  }
}
