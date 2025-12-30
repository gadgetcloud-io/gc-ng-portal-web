import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  features = [
    {
      icon: '📱',
      title: 'Device Inventory',
      description: 'Track all devices with purchase dates, warranty info, and documents—never lose coverage details again.'
    },
    {
      icon: '⏰',
      title: 'Smart Reminders',
      description: 'Get notified before warranties expire, renewals are due, or maintenance windows open.'
    },
    {
      icon: '🔒',
      title: 'Secure Storage',
      description: 'Encrypted document storage for receipts, warranties, and manuals—accessible anytime, anywhere.'
    },
    {
      icon: '✓',
      title: 'Coverage Confidence',
      description: 'Know exactly what\'s covered, what\'s expiring, and what needs attention with real-time dashboards.'
    },
    {
      icon: '👥',
      title: 'Team Collaboration',
      description: 'Share device info across teams, assign responsibilities, and streamline maintenance workflows.'
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Track spending, coverage gaps, and device lifecycle—make data-driven decisions.'
    }
  ];

  processSteps = [
    {
      number: '1',
      title: 'Capture',
      description: 'Scan barcodes, import receipts, or manually add devices. Upload documents and set warranty dates.',
      icon: '📸'
    },
    {
      number: '2',
      title: 'Automate',
      description: 'Track warranties automatically. Sync with calendars. Get reminders before coverage expires.',
      icon: '⚙️'
    },
    {
      number: '3',
      title: 'Act',
      description: 'File claims, schedule repairs, generate reports. Everything you need in one place.',
      icon: '✨'
    }
  ];

  testimonials = [
    {
      name: 'Sarah Chen',
      role: 'IT Manager, TechCorp',
      avatar: 'SC',
      text: 'GadgetCloud reduced our warranty tracking time by 90%. We caught 12 expiring warranties last quarter that would have cost us $15K to replace.'
    },
    {
      name: 'Michael Rodriguez',
      role: 'Small Business Owner',
      avatar: 'MR',
      text: 'The barcode scanning feature is a game-changer. Set up our entire office inventory in under an hour.'
    },
    {
      name: 'Emily Watson',
      role: 'Operations Manager',
      avatar: 'EW',
      text: 'Finally, a system that makes sense. Our team actually uses it because it\'s that easy.'
    }
  ];

  stats = [
    { value: '482', label: 'Devices Tracked' },
    { value: '98%', label: 'Coverage Rate' },
    { value: '12', label: 'Renewals Due' },
    { value: '3', label: 'Active Claims' }
  ];

  scrollToFeatures(): void {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }
}
