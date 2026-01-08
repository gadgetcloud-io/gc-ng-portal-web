import { Injectable } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { DeviceService, Device } from './device.service';

/**
 * Analytics data for a single device
 */
export interface DeviceAnalytics {
  deviceId: string;
  deviceName: string;
  purchasePrice: number;
  currentValue: number;
  depreciationAmount: number;
  depreciationPercentage: number;
  warrantyValue: number;
  warrantyStatus: 'active' | 'expiring-soon' | 'expired';
  daysUntilExpiry: number;
  estimatedRepairCost: number;
  protectionValue: number;  // Warranty value + estimated repair savings
}

/**
 * Aggregated analytics across all devices
 */
export interface PortfolioAnalytics {
  totalDevices: number;
  totalPurchaseValue: number;
  totalCurrentValue: number;
  totalDepreciation: number;
  totalDepreciationPercentage: number;
  totalWarrantyValue: number;
  totalProtectionValue: number;
  activeWarranties: number;
  expiringWarranties: number;
  expiredWarranties: number;
  averageDeviceAge: number;  // in months
  categoryBreakdown: CategoryBreakdown[];
  warrantyTimeline: WarrantyTimelineItem[];
  depreciationTrend: DepreciationTrendItem[];
}

/**
 * Breakdown by device category
 */
export interface CategoryBreakdown {
  category: string;
  deviceCount: number;
  totalValue: number;
  currentValue: number;
  depreciationAmount: number;
  warrantyValue: number;
}

/**
 * Warranty expiration timeline
 */
export interface WarrantyTimelineItem {
  month: string;  // e.g., "2026-02"
  expiringCount: number;
  expiringValue: number;
  deviceNames: string[];
}

/**
 * Depreciation trend over time
 */
export interface DepreciationTrendItem {
  month: string;
  portfolioValue: number;
  cumulativeDepreciation: number;
}

/**
 * Depreciation rates by device category (annual %)
 */
const DEPRECIATION_RATES: Record<string, number> = {
  'laptop': 0.25,        // 25% per year
  'smartphone': 0.35,    // 35% per year
  'tablet': 0.30,        // 30% per year
  'smartwatch': 0.30,    // 30% per year
  'headphones': 0.20,    // 20% per year
  'camera': 0.20,        // 20% per year
  'gaming-console': 0.15, // 15% per year
  'tv': 0.15,            // 15% per year
  'other': 0.20          // 20% per year (default)
};

/**
 * Average repair cost as percentage of purchase price
 */
const REPAIR_COST_PERCENTAGE = 0.20; // 20% of purchase price

/**
 * Analytics service for calculating device depreciation, warranty value, and protection metrics
 *
 * Features:
 * - Device-level depreciation tracking using industry-standard rates
 * - Warranty protection value calculation
 * - Portfolio-level aggregated analytics
 * - Category-wise breakdowns
 * - Warranty expiration timeline
 * - Depreciation trends over time
 *
 * Usage:
 * ```typescript
 * // Get portfolio analytics
 * this.analytics.getPortfolioAnalytics$().subscribe(analytics => {
 *   console.log('Total Value:', analytics.totalCurrentValue);
 *   console.log('Protection Value:', analytics.totalProtectionValue);
 * });
 *
 * // Get device-level analytics
 * this.analytics.getDeviceAnalytics(deviceId).subscribe(analytics => {
 *   console.log('Depreciation:', analytics.depreciationPercentage);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private deviceService: DeviceService) {}

  /**
   * Get analytics for a specific device
   */
  getDeviceAnalytics$(deviceId: string): Observable<DeviceAnalytics | null> {
    return this.deviceService.devices$.pipe(
      map((devices: Device[]) => {
        const device = devices.find((d: Device) => d.id === deviceId);
        if (!device) return null;

        return this.calculateDeviceAnalytics(device);
      })
    );
  }

  /**
   * Get analytics for all devices (portfolio level)
   */
  getPortfolioAnalytics$(): Observable<PortfolioAnalytics> {
    return this.deviceService.devices$.pipe(
      map((devices: Device[]) => this.calculatePortfolioAnalytics(devices))
    );
  }

  /**
   * Calculate analytics for a single device
   */
  private calculateDeviceAnalytics(device: Device): DeviceAnalytics {
    // Default purchase price to 0 if not provided
    const purchasePrice = device.purchasePrice || 0;

    const ageInMonths = this.calculateDeviceAge(device.purchaseDate);
    const depreciationRate = DEPRECIATION_RATES[device.category] || DEPRECIATION_RATES['other'];

    // Calculate current value using exponential depreciation
    const yearsOld = ageInMonths / 12;
    const currentValue = purchasePrice * Math.pow(1 - depreciationRate, yearsOld);
    const depreciationAmount = purchasePrice - currentValue;
    const depreciationPercentage = purchasePrice > 0 ? (depreciationAmount / purchasePrice) * 100 : 0;

    // Calculate warranty status and days until expiry
    const warrantyStatus = this.getWarrantyStatus(device.warrantyExpires);
    const daysUntilExpiry = this.getDaysUntilExpiry(device.warrantyExpires);

    // Calculate warranty value (remaining months * monthly value)
    const monthlyWarrantyValue = purchasePrice * 0.01; // 1% of purchase price per month
    const remainingMonths = Math.max(0, daysUntilExpiry / 30);
    const warrantyValue = monthlyWarrantyValue * remainingMonths;

    // Estimate repair cost
    const estimatedRepairCost = purchasePrice * REPAIR_COST_PERCENTAGE;

    // Calculate protection value (warranty value + potential repair savings)
    const protectionValue = warrantyValue + (warrantyStatus === 'active' ? estimatedRepairCost : 0);

    return {
      deviceId: device.id,
      deviceName: device.name,
      purchasePrice,
      currentValue: Math.round(currentValue),
      depreciationAmount: Math.round(depreciationAmount),
      depreciationPercentage: Math.round(depreciationPercentage * 10) / 10,
      warrantyValue: Math.round(warrantyValue),
      warrantyStatus,
      daysUntilExpiry,
      estimatedRepairCost: Math.round(estimatedRepairCost),
      protectionValue: Math.round(protectionValue)
    };
  }

  /**
   * Calculate portfolio-level analytics across all devices
   */
  private calculatePortfolioAnalytics(devices: Device[]): PortfolioAnalytics {
    if (devices.length === 0) {
      return this.getEmptyPortfolioAnalytics();
    }

    // Calculate device-level analytics
    const deviceAnalytics = devices.map(device => this.calculateDeviceAnalytics(device));

    // Aggregate totals
    const totalPurchaseValue = deviceAnalytics.reduce((sum, d) => sum + d.purchasePrice, 0);
    const totalCurrentValue = deviceAnalytics.reduce((sum, d) => sum + d.currentValue, 0);
    const totalDepreciation = totalPurchaseValue - totalCurrentValue;
    const totalDepreciationPercentage = (totalDepreciation / totalPurchaseValue) * 100;
    const totalWarrantyValue = deviceAnalytics.reduce((sum, d) => sum + d.warrantyValue, 0);
    const totalProtectionValue = deviceAnalytics.reduce((sum, d) => sum + d.protectionValue, 0);

    // Count warranties by status
    const activeWarranties = deviceAnalytics.filter(d => d.warrantyStatus === 'active').length;
    const expiringWarranties = deviceAnalytics.filter(d => d.warrantyStatus === 'expiring-soon').length;
    const expiredWarranties = deviceAnalytics.filter(d => d.warrantyStatus === 'expired').length;

    // Calculate average device age
    const totalAgeInMonths = devices.reduce((sum, device) => {
      return sum + this.calculateDeviceAge(device.purchaseDate);
    }, 0);
    const averageDeviceAge = totalAgeInMonths / devices.length;

    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(devices, deviceAnalytics);

    // Calculate warranty timeline
    const warrantyTimeline = this.calculateWarrantyTimeline(devices, deviceAnalytics);

    // Calculate depreciation trend
    const depreciationTrend = this.calculateDepreciationTrend(devices, deviceAnalytics);

    return {
      totalDevices: devices.length,
      totalPurchaseValue: Math.round(totalPurchaseValue),
      totalCurrentValue: Math.round(totalCurrentValue),
      totalDepreciation: Math.round(totalDepreciation),
      totalDepreciationPercentage: Math.round(totalDepreciationPercentage * 10) / 10,
      totalWarrantyValue: Math.round(totalWarrantyValue),
      totalProtectionValue: Math.round(totalProtectionValue),
      activeWarranties,
      expiringWarranties,
      expiredWarranties,
      averageDeviceAge: Math.round(averageDeviceAge * 10) / 10,
      categoryBreakdown,
      warrantyTimeline,
      depreciationTrend
    };
  }

  /**
   * Calculate breakdown by device category
   */
  private calculateCategoryBreakdown(devices: Device[], analytics: DeviceAnalytics[]): CategoryBreakdown[] {
    const categories = new Map<string, CategoryBreakdown>();

    devices.forEach((device, index) => {
      const deviceAnalytic = analytics[index];
      const category = device.category;

      if (!categories.has(category)) {
        categories.set(category, {
          category,
          deviceCount: 0,
          totalValue: 0,
          currentValue: 0,
          depreciationAmount: 0,
          warrantyValue: 0
        });
      }

      const breakdown = categories.get(category)!;
      breakdown.deviceCount++;
      breakdown.totalValue += deviceAnalytic.purchasePrice;
      breakdown.currentValue += deviceAnalytic.currentValue;
      breakdown.depreciationAmount += deviceAnalytic.depreciationAmount;
      breakdown.warrantyValue += deviceAnalytic.warrantyValue;
    });

    return Array.from(categories.values())
      .sort((a, b) => b.totalValue - a.totalValue);
  }

  /**
   * Calculate warranty expiration timeline (next 12 months)
   */
  private calculateWarrantyTimeline(devices: Device[], analytics: DeviceAnalytics[]): WarrantyTimelineItem[] {
    const timeline = new Map<string, WarrantyTimelineItem>();
    const today = new Date();

    devices.forEach((device, index) => {
      const deviceAnalytic = analytics[index];

      // Only include active and expiring-soon warranties
      if (deviceAnalytic.warrantyStatus === 'expired') return;

      const expiryDate = new Date(device.warrantyExpires);
      if (expiryDate < today) return;

      // Group by month
      const monthKey = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}`;

      if (!timeline.has(monthKey)) {
        timeline.set(monthKey, {
          month: monthKey,
          expiringCount: 0,
          expiringValue: 0,
          deviceNames: []
        });
      }

      const item = timeline.get(monthKey)!;
      item.expiringCount++;
      item.expiringValue += deviceAnalytic.warrantyValue;
      item.deviceNames.push(device.name);
    });

    return Array.from(timeline.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(0, 12); // Next 12 months
  }

  /**
   * Calculate depreciation trend over time (past 24 months)
   */
  private calculateDepreciationTrend(devices: Device[], analytics: DeviceAnalytics[]): DepreciationTrendItem[] {
    const trend: DepreciationTrendItem[] = [];
    const today = new Date();

    // Calculate for past 24 months
    for (let i = 23; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

      // Calculate portfolio value and depreciation at that point in time
      let portfolioValue = 0;
      let cumulativeDepreciation = 0;

      devices.forEach((device, index) => {
        const purchaseDate = new Date(device.purchaseDate);
        if (purchaseDate > targetDate) return; // Device not purchased yet

        const purchasePrice = device.purchasePrice || 0;
        const ageAtTargetDate = this.calculateMonthsBetween(purchaseDate, targetDate);
        const depreciationRate = DEPRECIATION_RATES[device.category] || DEPRECIATION_RATES['other'];
        const yearsOld = ageAtTargetDate / 12;
        const valueAtTargetDate = purchasePrice * Math.pow(1 - depreciationRate, yearsOld);

        portfolioValue += valueAtTargetDate;
        cumulativeDepreciation += (purchasePrice - valueAtTargetDate);
      });

      trend.push({
        month: monthKey,
        portfolioValue: Math.round(portfolioValue),
        cumulativeDepreciation: Math.round(cumulativeDepreciation)
      });
    }

    return trend;
  }

  /**
   * Get warranty status for a device
   */
  private getWarrantyStatus(warrantyExpiry: string): 'active' | 'expiring-soon' | 'expired' {
    const daysUntilExpiry = this.getDaysUntilExpiry(warrantyExpiry);

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'active';
  }

  /**
   * Calculate days until warranty expiry
   */
  private getDaysUntilExpiry(warrantyExpiry: string): number {
    const today = new Date();
    const expiryDate = new Date(warrantyExpiry);
    const diffMs = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate device age in months
   */
  private calculateDeviceAge(purchaseDate: string): number {
    const today = new Date();
    const purchase = new Date(purchaseDate);
    return this.calculateMonthsBetween(purchase, today);
  }

  /**
   * Calculate months between two dates
   */
  private calculateMonthsBetween(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Get empty portfolio analytics (when no devices)
   */
  private getEmptyPortfolioAnalytics(): PortfolioAnalytics {
    return {
      totalDevices: 0,
      totalPurchaseValue: 0,
      totalCurrentValue: 0,
      totalDepreciation: 0,
      totalDepreciationPercentage: 0,
      totalWarrantyValue: 0,
      totalProtectionValue: 0,
      activeWarranties: 0,
      expiringWarranties: 0,
      expiredWarranties: 0,
      averageDeviceAge: 0,
      categoryBreakdown: [],
      warrantyTimeline: [],
      depreciationTrend: []
    };
  }
}
