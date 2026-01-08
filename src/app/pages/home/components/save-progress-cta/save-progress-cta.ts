import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { HomeDemoService, DemoState } from '../../services/home-demo.service';

@Component({
  selector: 'app-save-progress-cta',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './save-progress-cta.html',
  styleUrl: './save-progress-cta.scss',
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class SaveProgressCtaComponent implements OnInit, OnDestroy {
  @Output() signupClick = new EventEmitter<void>();

  // State
  deviceCount = 0;
  engagementScore = 0;
  showCta = false;
  isDismissed = false;

  private subscription?: Subscription;

  constructor(private homeDemoService: HomeDemoService) {}

  ngOnInit(): void {
    // Subscribe to demo state changes
    this.subscription = this.homeDemoService.demoState$.subscribe((state: DemoState) => {
      this.updateState(state);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Update component state based on demo state
   */
  private updateState(state: DemoState): void {
    this.deviceCount = state.devices.length;
    this.engagementScore = state.engagementScore;

    // Show CTA if:
    // 1. User has added at least 1 device
    // 2. Not dismissed by user
    // 3. Service says to show CTA
    this.showCta = !this.isDismissed && state.showSaveCTA && this.deviceCount > 0;
  }

  /**
   * Handle signup button click
   */
  onSignupClick(): void {
    this.signupClick.emit();
  }

  /**
   * Dismiss the CTA
   */
  dismiss(): void {
    this.isDismissed = true;
    this.showCta = false;
  }

  /**
   * Get CTA message based on device count
   */
  getCtaMessage(): string {
    if (this.deviceCount === 1) {
      return "Don't lose your gadget!";
    } else if (this.deviceCount === 2) {
      return "Save your 2 gadgets!";
    } else {
      return `Save your ${this.deviceCount} gadgets!`;
    }
  }

  /**
   * Get CTA submessage
   */
  getCtaSubmessage(): string {
    if (this.deviceCount === 1) {
      return 'Sign up now to keep it safe';
    } else {
      return 'Sign up now to keep them safe';
    }
  }

  /**
   * Get progress percentage for visual indicator
   */
  getProgressPercent(): number {
    return this.engagementScore;
  }
}
