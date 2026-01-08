import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { HomeDemoService, DemoState } from '../../services/home-demo.service';

interface ProgressStep {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
  progress: number; // 0-100
}

@Component({
  selector: 'app-progress-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-indicator.html',
  styleUrl: './progress-indicator.scss',
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class ProgressIndicatorComponent implements OnInit, OnDestroy {
  steps: ProgressStep[] = [
    { id: 'device', label: 'Add Device', icon: '📱', completed: false, progress: 0 },
    { id: 'photo', label: 'Upload Photo', icon: '📸', completed: false, progress: 0 },
    { id: 'calculator', label: 'Calculate Savings', icon: '💰', completed: false, progress: 0 },
    { id: 'comparison', label: 'See Before/After', icon: '⚖️', completed: false, progress: 0 }
  ];

  overallProgress = 0;
  engagementScore = 0;
  showIndicator = false; // Only show after first interaction

  private subscription?: Subscription;

  constructor(private homeDemoService: HomeDemoService) {}

  ngOnInit(): void {
    // Subscribe to demo state changes
    this.subscription = this.homeDemoService.demoState$.subscribe((state: DemoState) => {
      this.updateProgress(state);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Update progress based on demo state
   */
  private updateProgress(state: DemoState): void {
    // Update individual steps
    this.steps[0].completed = state.devices.length > 0;
    this.steps[0].progress = state.devices.length > 0 ? 100 : 0;

    this.steps[1].completed = state.photoUploaded;
    this.steps[1].progress = state.photoUploaded ? 100 : 0;

    this.steps[2].completed = state.calculatorUsed;
    this.steps[2].progress = state.calculatorUsed ? 100 : 0;

    this.steps[3].completed = state.comparisonViewed;
    this.steps[3].progress = state.comparisonViewed ? 100 : 0;

    // Calculate overall progress (average of all steps)
    const completedSteps = this.steps.filter(s => s.completed).length;
    this.overallProgress = (completedSteps / this.steps.length) * 100;

    // Get engagement score from service
    this.engagementScore = state.engagementScore;

    // Show indicator after first interaction
    this.showIndicator = this.engagementScore > 0;
  }

  /**
   * Get progress bar width style
   */
  getProgressWidth(): string {
    return `${this.overallProgress}%`;
  }

  /**
   * Get step status class
   */
  getStepClass(step: ProgressStep): string {
    return step.completed ? 'completed' : 'pending';
  }
}
