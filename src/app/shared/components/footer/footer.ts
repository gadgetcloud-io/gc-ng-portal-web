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
      { label: 'Features', path: '/features', active: true },
      { label: 'Pricing', path: '/pricing', active: true },
      { label: 'Security', path: '/security', active: false },
      { label: 'Roadmap', path: '/roadmap', active: false }
    ],
    company: [
      { label: 'About Us', path: '/about', active: true },
      { label: 'Careers', path: '/careers', active: false },
      { label: 'Blog', path: '/blog', active: false },
      { label: 'Press Kit', path: '/press', active: false }
    ],
    resources: [
      { label: 'Documentation', path: '/docs', active: false },
      { label: 'API Reference', path: '/api', active: false },
      { label: 'Help Center', path: '/help', active: false },
      { label: 'Community', path: '/community', active: false }
    ],
    legal: [
      { label: 'Privacy Policy', path: '/privacy', active: false },
      { label: 'Terms of Service', path: '/terms', active: false },
      { label: 'Cookie Policy', path: '/cookies', active: false },
      { label: 'GDPR', path: '/gdpr', active: false }
    ]
  };

  socialLinks = [
    { name: 'Twitter', url: 'https://twitter.com/gadgetcloud', icon: 'twitter' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/gadgetcloud', icon: 'linkedin' },
    { name: 'GitHub', url: 'https://github.com/gadgetcloud', icon: 'github' },
    { name: 'YouTube', url: 'https://youtube.com/@gadgetcloud', icon: 'youtube' }
  ];
}
