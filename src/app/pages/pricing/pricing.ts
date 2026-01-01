import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';
import { SeoService } from '../../core/services/seo.service';
import { SEO_CONFIG } from '../../core/config/seo-metadata.config';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent, ScrollRevealDirective],
  templateUrl: './pricing.html',
  styleUrl: './pricing.scss'
})
export class PricingComponent implements OnInit {

  constructor(private seoService: SeoService) {}

  ngOnInit(): void {
    this.updateSEO();
  }

  private updateSEO(): void {
    const breadcrumbSchema = this.seoService.createBreadcrumbSchema([
      { name: 'Home', url: 'https://www.gadgetcloud.io' },
      { name: 'Pricing' }
    ]);

    const productSchemas = this.pricingPlans.map(plan =>
      this.seoService.createProductSchema({
        name: plan.name,
        description: plan.description,
        price: plan.price,
        features: plan.features
      })
    );

    const faqSchema = this.seoService.createFAQSchema(
      this.faqs.map(faq => ({
        question: faq.question,
        answer: faq.answer
      }))
    );

    this.seoService.updateMetadata({
      ...SEO_CONFIG['pricing'],
      structuredData: [breadcrumbSchema, ...productSchemas, faqSchema]
    });
  }

  pricingPlans = [
    {
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Perfect for personal use with a few devices',
      features: [
        'Up to 5 devices',
        '100 MB storage',
        'Basic warranty tracking',
        'Email notifications',
        'Mobile app access',
        'Community support'
      ],
      cta: 'Get Started',
      popular: false,
      variant: 'secondary' as const
    },
    {
      name: 'Pro',
      price: '9',
      period: 'per month',
      description: 'Ideal for power users and small teams',
      features: [
        'Up to 50 devices',
        '10 GB storage',
        'Advanced warranty tracking',
        'SMS & email notifications',
        'Team collaboration (5 users)',
        'Priority support',
        'Custom categories',
        'Export reports',
        'API access'
      ],
      cta: 'Start Free Trial',
      popular: true,
      variant: 'primary' as const
    },
    {
      name: 'Business',
      price: '29',
      period: 'per month',
      description: 'For businesses managing large device fleets',
      features: [
        'Unlimited devices',
        '100 GB storage',
        'Enterprise warranty tracking',
        'Multi-channel notifications',
        'Unlimited team members',
        '24/7 priority support',
        'Custom integrations',
        'Advanced analytics',
        'SSO & SAML',
        'Dedicated account manager',
        'SLA guarantee'
      ],
      cta: 'Contact Sales',
      popular: false,
      variant: 'secondary' as const
    }
  ];

  faqs = [
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any charges.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and bank transfers for annual plans.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! Pro and Business plans include a 14-day free trial. No credit card required to start.'
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'You can export all your data before canceling. We retain your data for 30 days after cancellation in case you change your mind.'
    },
    {
      question: 'Do you offer annual billing?',
      answer: 'Yes! Save 20% with annual billing. Pro is $86/year (save $22) and Business is $278/year (save $70).'
    },
    {
      question: 'Can I get a custom enterprise plan?',
      answer: 'Absolutely! Contact our sales team for custom pricing based on your specific needs and volume.'
    }
  ];

  comparisonFeatures = [
    {
      category: 'Core Features',
      items: [
        {
          name: 'Device inventory',
          free: true,
          pro: true,
          business: true
        },
        {
          name: 'Document storage',
          free: '100 MB',
          pro: '10 GB',
          business: '100 GB'
        },
        {
          name: 'Warranty tracking',
          free: 'Basic',
          pro: 'Advanced',
          business: 'Enterprise'
        },
        {
          name: 'Mobile apps',
          free: true,
          pro: true,
          business: true
        }
      ]
    },
    {
      category: 'Collaboration',
      items: [
        {
          name: 'Team members',
          free: '1',
          pro: '5',
          business: 'Unlimited'
        },
        {
          name: 'Shared workspaces',
          free: false,
          pro: true,
          business: true
        },
        {
          name: 'Activity logs',
          free: false,
          pro: true,
          business: true
        }
      ]
    },
    {
      category: 'Advanced Features',
      items: [
        {
          name: 'API access',
          free: false,
          pro: true,
          business: true
        },
        {
          name: 'Custom integrations',
          free: false,
          pro: false,
          business: true
        },
        {
          name: 'SSO & SAML',
          free: false,
          pro: false,
          business: true
        },
        {
          name: 'Advanced analytics',
          free: false,
          pro: false,
          business: true
        }
      ]
    }
  ];
}
