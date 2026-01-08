import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeDemoService } from '../../services/home-demo.service';

@Component({
  selector: 'app-before-after-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './before-after-slider.html',
  styleUrl: './before-after-slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BeforeAfterSliderComponent implements OnInit, OnDestroy {
  @ViewChild('slider', { static: false }) sliderElement?: ElementRef<HTMLDivElement>;
  @ViewChild('divider', { static: false }) dividerElement?: ElementRef<HTMLDivElement>;

  // Slider position (0-100%)
  sliderPosition = 50;

  // Drag state
  private isDragging = false;
  private hasTrackedEngagement = false;

  // Mobile: tap to toggle
  isMobile = false;

  constructor(private homeDemoService: HomeDemoService) {}

  ngOnInit(): void {
    // Detect mobile
    this.isMobile = window.innerWidth < 768;

    // Add event listeners for dragging
    if (!this.isMobile) {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
    }

    // Track engagement on first interaction
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    // Clean up event listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', this.onResize);
  }

  /**
   * Start dragging (desktop)
   */
  onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.trackEngagementOnce();
  }

  /**
   * Mouse move handler (desktop)
   */
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging || !this.sliderElement) return;

    this.updateSliderPosition(event.clientX);
  };

  /**
   * Mouse up handler (desktop)
   */
  private onMouseUp = (): void => {
    this.isDragging = false;
  };

  /**
   * Touch start (mobile)
   */
  onTouchStart(event: TouchEvent): void {
    this.isDragging = true;
    this.trackEngagementOnce();
  }

  /**
   * Touch move (mobile)
   */
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || !this.sliderElement) return;

    const touch = event.touches[0];
    this.updateSliderPosition(touch.clientX);
  }

  /**
   * Touch end (mobile)
   */
  onTouchEnd(): void {
    this.isDragging = false;
  }

  /**
   * Tap to toggle (mobile alternative)
   */
  onTap(): void {
    if (!this.isMobile) return;

    // Toggle between 25%, 50%, 75%
    if (this.sliderPosition === 50) {
      this.sliderPosition = 25;
    } else if (this.sliderPosition === 25) {
      this.sliderPosition = 75;
    } else {
      this.sliderPosition = 50;
    }

    this.trackEngagementOnce();
  }

  /**
   * Update slider position based on mouse/touch X coordinate
   */
  private updateSliderPosition(clientX: number): void {
    if (!this.sliderElement) return;

    const rect = this.sliderElement.nativeElement.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    // Clamp between 0 and 100
    this.sliderPosition = Math.max(0, Math.min(100, percentage));
  }

  /**
   * Track engagement (once)
   */
  private trackEngagementOnce(): void {
    if (!this.hasTrackedEngagement) {
      this.homeDemoService.trackEngagement('viewComparison');
      this.hasTrackedEngagement = true;
    }
  }

  /**
   * Handle window resize
   */
  private onResize = (): void => {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth < 768;

    // If switching from mobile to desktop or vice versa, reset position
    if (wasMobile !== this.isMobile) {
      this.sliderPosition = 50;
    }
  };

  /**
   * Get slider width style
   */
  getSliderWidth(): string {
    return `${this.sliderPosition}%`;
  }

  /**
   * Get divider position style
   */
  getDividerPosition(): string {
    return `${this.sliderPosition}%`;
  }
}
