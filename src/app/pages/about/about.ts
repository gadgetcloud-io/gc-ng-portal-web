import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { SeoService } from '../../core/services/seo.service';
import { SEO_CONFIG } from '../../core/config/seo-metadata.config';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class AboutComponent implements OnInit {

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.updateSEO();
  }

  private updateSEO(): void {
    const organizationSchema = this.seoService.createOrganizationSchema();
    const breadcrumbSchema = this.seoService.createBreadcrumbSchema([
      { name: 'Home', url: 'https://www.gadgetcloud.io' },
      { name: 'About' }
    ]);

    this.seoService.updateMetadata({
      ...SEO_CONFIG['about'],
      structuredData: [organizationSchema, breadcrumbSchema]
    });
  }

  stats = [
    { value: '2024', label: 'Founded' },
    { value: '10K+', label: 'Active Users' },
    { value: '50K+', label: 'Devices Managed' },
    { value: '98%', label: 'Satisfaction Rate' }
  ];

  values = [
    {
      icon: '🎯',
      title: 'Customer First',
      description: 'We build features based on real user needs and feedback. Your success is our success.'
    },
    {
      icon: '🔒',
      title: 'Security & Privacy',
      description: 'Your data is encrypted, secure, and never shared. We take data protection seriously.'
    },
    {
      icon: '💡',
      title: 'Innovation',
      description: 'We constantly improve and innovate to make device management simpler and smarter.'
    },
    {
      icon: '🤝',
      title: 'Transparency',
      description: 'Clear pricing, honest communication, and no hidden fees. What you see is what you get.'
    }
  ];

  team = [
    {
      name: 'Ganesh Kumar',
      role: 'Founder & CEO',
      avatar: 'GK',
      bio: 'Building tools to simplify gadget management for everyone.'
    },
    {
      name: 'Engineering Team',
      role: 'Product Development',
      avatar: 'ET',
      bio: 'Creating scalable, secure solutions for device tracking.'
    },
    {
      name: 'Support Team',
      role: 'Customer Success',
      avatar: 'ST',
      bio: 'Helping users get the most out of GadgetCloud.'
    }
  ];

  milestones = [
    { year: '2024', event: 'GadgetCloud launched to help users manage device warranties' },
    { year: '2024 Q2', event: 'Reached 1,000 devices tracked across 200+ users' },
    { year: '2024 Q3', event: 'Introduced team collaboration and analytics features' },
    { year: '2024 Q4', event: 'Expanded to 10,000+ users managing 50,000+ devices' }
  ];
}
