import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  footerLinks = {
    product: [
      { label: 'Features', path: '/features' },
      { label: 'Pricing', path: '/pricing' },
      { label: 'Security', path: '/security' },
      { label: 'Roadmap', path: '/roadmap' }
    ],
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'Careers', path: '/careers' },
      { label: 'Blog', path: '/blog' },
      { label: 'Press Kit', path: '/press' }
    ],
    resources: [
      { label: 'Documentation', path: '/docs' },
      { label: 'API Reference', path: '/api' },
      { label: 'Help Center', path: '/help' },
      { label: 'Community', path: '/community' }
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Terms of Service', path: '/terms' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'GDPR', path: '/gdpr' }
    ]
  };

  socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com/gadgetcloud', icon: 'twitter' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/gadgetcloud', icon: 'linkedin' },
    { name: 'GitHub', url: 'https://github.com/gadgetcloud', icon: 'github' },
    { name: 'YouTube', url: 'https://youtube.com/@gadgetcloud', icon: 'youtube' }
  ];
}
