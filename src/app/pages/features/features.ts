import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { SeoService } from '../../core/services/seo.service';
import { SEO_CONFIG } from '../../core/config/seo-metadata.config';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, ScrollRevealDirective],
  templateUrl: './features.html',
  styleUrl: './features.scss'
})
export class FeaturesComponent implements OnInit {

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.updateSEO();
  }

  private updateSEO(): void {
    const breadcrumbSchema = this.seoService.createBreadcrumbSchema([
      { name: 'Home', url: 'https://www.gadgetcloud.io' },
      { name: 'Features' }
    ]);

    const featureListSchema = this.seoService.createItemListSchema(
      this.mainFeatures.slice(0, 6).map(feature => ({
        title: feature.title,
        description: feature.description
      }))
    );

    this.seoService.updateMetadata({
      ...SEO_CONFIG['features'],
      structuredData: [breadcrumbSchema, featureListSchema]
    });
  }

  mainFeatures = [
    {
      icon: '📱',
      title: 'Device Inventory',
      description: 'Complete catalog of all your gadgets with purchase dates, serial numbers, and warranty information. Never lose track of what you own.',
      benefits: [
        'Automatic device detection',
        'Barcode scanning',
        'Photo attachments',
        'Custom categorization'
      ]
    },
    {
      icon: '📄',
      title: 'Document Management',
      description: 'Store receipts, warranties, manuals, and service records in one secure place. Access them anytime, anywhere.',
      benefits: [
        'OCR text extraction',
        'Cloud backup',
        'Easy search',
        'Share securely'
      ]
    },
    {
      icon: '🔔',
      title: 'Smart Reminders',
      description: 'Never miss a warranty expiration or maintenance schedule. Get timely notifications for upcoming renewals and service dates.',
      benefits: [
        'Email & SMS alerts',
        'Customizable schedules',
        'Warranty expiration tracking',
        'Service reminders'
      ]
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'Bank-level AES-256 encryption protects your data. Your privacy is our top priority.',
      benefits: [
        'End-to-end encryption',
        'Two-factor authentication',
        'Regular security audits',
        'GDPR compliant'
      ]
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Share devices and documents with family members or team members. Perfect for businesses managing multiple assets.',
      benefits: [
        'Role-based access',
        'Activity logs',
        'Shared workspaces',
        'Comment threads'
      ]
    },
    {
      icon: '📊',
      title: 'Reports & Analytics',
      description: 'Track warranty coverage, maintenance costs, and device lifecycle. Make informed decisions with detailed insights.',
      benefits: [
        'Coverage reports',
        'Cost tracking',
        'Export to CSV/PDF',
        'Custom dashboards'
      ]
    }
  ];

  integrations = [
    {
      icon: '🏪',
      name: 'Amazon',
      description: 'Auto-import purchases'
    },
    {
      icon: '🍎',
      name: 'Apple',
      description: 'Sync Apple devices'
    },
    {
      icon: '📧',
      name: 'Gmail',
      description: 'Extract receipts'
    },
    {
      icon: '☁️',
      name: 'Google Drive',
      description: 'Backup documents'
    },
    {
      icon: '📂',
      name: 'Dropbox',
      description: 'Sync files'
    },
    {
      icon: '💬',
      name: 'Slack',
      description: 'Team notifications'
    }
  ];

  platforms = [
    {
      icon: '🌐',
      name: 'Web',
      description: 'Full-featured web dashboard accessible from any browser'
    },
    {
      icon: '📱',
      name: 'iOS',
      description: 'Native iPhone and iPad app with offline support'
    },
    {
      icon: '🤖',
      name: 'Android',
      description: 'Native Android app with Material Design'
    },
    {
      icon: '💻',
      name: 'Desktop',
      description: 'Windows, Mac, and Linux desktop applications'
    }
  ];
}
