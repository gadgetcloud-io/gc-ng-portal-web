import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeDemoService } from '../../services/home-demo.service';

@Component({
  selector: 'app-warranty-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warranty-calculator.html',
  styleUrl: './warranty-calculator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WarrantyCalculatorComponent implements OnInit {
  // Slider values
  purchasePrice = 50000;
  warrantyMonths = 24;

  // Calculated values
  averageRepairCost = 0;
  potentialSavings = 0;
  warrantyPeriod = '';

  // Stats for visualization
  repairProbability = 0;
  repairCountEstimate = 0;

  constructor(private homeDemoService: HomeDemoService) {}

  ngOnInit(): void {
    this.calculate();
  }

  /**
   * Triggered when sliders change
   */
  onSliderChange(): void {
    this.calculate();

    // Track engagement on first use
    if (!this.hasTrackedEngagement) {
      this.homeDemoService.trackEngagement('useCalculator');
      this.hasTrackedEngagement = true;
    }
  }

  private hasTrackedEngagement = false;

  /**
   * Calculate warranty savings based on inputs
   */
  private calculate(): void {
    // Calculate average repair cost (typically 15-25% of purchase price)
    this.averageRepairCost = Math.round(this.purchasePrice * 0.20);

    // Calculate repair probability based on warranty period
    // Longer warranty = higher chance you'll need it
    this.repairProbability = Math.min(this.warrantyMonths / 36 * 0.35, 0.45); // Max 45% chance

    // Estimate number of repairs (0-2 repairs typical)
    this.repairCountEstimate = Math.round(this.repairProbability * 4) / 2; // 0, 0.5, 1, 1.5, 2

    // Calculate potential savings
    // = (average repair cost) * (repair probability) * (repair count)
    const rawSavings = this.averageRepairCost * this.repairProbability * (1 + this.repairCountEstimate);
    this.potentialSavings = Math.round(rawSavings / 1000) * 1000; // Round to nearest 1000

    // Format warranty period
    if (this.warrantyMonths < 12) {
      this.warrantyPeriod = `${this.warrantyMonths} month${this.warrantyMonths > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(this.warrantyMonths / 12);
      const remainingMonths = this.warrantyMonths % 12;
      this.warrantyPeriod = years > 0
        ? `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths}mo` : ''}`
        : `${this.warrantyMonths} months`;
    }
  }

  /**
   * Get repair probability percentage
   */
  getRepairProbabilityPercent(): number {
    return Math.round(this.repairProbability * 100);
  }

  /**
   * Get recommendation based on calculations
   */
  getRecommendation(): string {
    const savingsRatio = this.potentialSavings / this.purchasePrice;

    if (savingsRatio > 0.15) {
      return 'High value! Warranty highly recommended.';
    } else if (savingsRatio > 0.08) {
      return 'Good value. Warranty recommended.';
    } else if (savingsRatio > 0.03) {
      return 'Moderate value. Consider your risk tolerance.';
    } else {
      return 'Lower value. May be optional for low-risk items.';
    }
  }

  /**
   * Get recommendation icon
   */
  getRecommendationIcon(): string {
    const savingsRatio = this.potentialSavings / this.purchasePrice;

    if (savingsRatio > 0.15) return '🎯';
    if (savingsRatio > 0.08) return '✅';
    if (savingsRatio > 0.03) return '💡';
    return '📋';
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  }
}
