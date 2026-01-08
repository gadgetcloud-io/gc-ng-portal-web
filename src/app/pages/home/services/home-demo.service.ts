import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Demo Device Interface
 */
export interface DemoDevice {
  id: string;
  name: string;
  category: string;
  brand: string;
  purchaseDate: string;
  warrantyMonths: number;
  warrantyExpiry: string;
  purchasePrice: number;
  photoUrl?: string;
}

/**
 * Photo Analysis Result Interface
 */
export interface PhotoAnalysisResult {
  brand: string;
  model: string;
  serialNumber: string;
  confidence: number;
}

/**
 * Demo State Interface
 */
export interface DemoState {
  // Device data
  devices: DemoDevice[];

  // Photo analysis
  currentPhoto?: File;
  photoAnalysisResult?: PhotoAnalysisResult;

  // Calculator
  totalPurchaseValue: number;
  potentialSavings: number;

  // Engagement tracking
  photoUploaded: boolean;
  calculatorUsed: boolean;
  comparisonViewed: boolean;
  engagementScore: number; // 0-100
  showSaveCTA: boolean;
}

/**
 * HomeDemoService
 *
 * Manages the state of the interactive demo on the home page.
 * Tracks user engagement, persists demo data to LocalStorage,
 * and facilitates transfer to real account on signup.
 */
@Injectable({
  providedIn: 'root'
})
export class HomeDemoService {
  private readonly STORAGE_KEY = 'gc_home_demo';
  private readonly ENGAGEMENT_WEIGHTS = {
    addDevice: 25,
    uploadPhoto: 30,
    useCalculator: 20,
    viewComparison: 15,
    additionalDevice: 10 // per extra device beyond first
  };

  private demoState = new BehaviorSubject<DemoState>(this.getInitialState());
  public demoState$: Observable<DemoState> = this.demoState.asObservable();

  constructor() {
    // Load demo data from LocalStorage on service initialization
    const savedState = this.loadDemoFromLocal();
    if (savedState) {
      this.demoState.next(savedState);
    }
  }

  /**
   * Get current demo state
   */
  getCurrentState(): DemoState {
    return this.demoState.value;
  }

  /**
   * Add a device to the demo
   */
  addDevice(device: Partial<DemoDevice>): void {
    const currentState = this.getCurrentState();

    // Calculate warranty expiry if not provided
    const purchaseDate = device.purchaseDate || new Date().toISOString().split('T')[0];
    const warrantyMonths = device.warrantyMonths || 12;
    let warrantyExpiry = device.warrantyExpiry;

    if (!warrantyExpiry) {
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);
      warrantyExpiry = expiryDate.toISOString().split('T')[0];
    }

    const newDevice: DemoDevice = {
      id: this.generateDeviceId(),
      name: device.name || 'Unnamed Device',
      category: device.category || 'other',
      brand: device.brand || 'Unknown',
      purchaseDate,
      warrantyMonths,
      warrantyExpiry,
      purchasePrice: device.purchasePrice || 0,
      photoUrl: device.photoUrl
    };

    const updatedDevices = [...currentState.devices, newDevice];

    this.updateState({
      devices: updatedDevices
    });

    // Update calculations
    this.updateTotalValue();
    this.calculateSavings();

    // Track engagement
    if (updatedDevices.length === 1) {
      this.trackEngagement('addDevice');
    } else {
      this.trackEngagement('additionalDevice');
    }

    // Save to LocalStorage
    this.saveDemoToLocal();
  }

  /**
   * Remove a device from the demo
   */
  removeDevice(id: string): void {
    const currentState = this.getCurrentState();
    const updatedDevices = currentState.devices.filter(d => d.id !== id);

    this.updateState({
      devices: updatedDevices
    });

    // Update calculations
    this.updateTotalValue();
    this.calculateSavings();

    // Save to LocalStorage
    this.saveDemoToLocal();
  }

  /**
   * Update a device in the demo
   */
  updateDevice(id: string, updates: Partial<DemoDevice>): void {
    const currentState = this.getCurrentState();
    const updatedDevices = currentState.devices.map(d =>
      d.id === id ? { ...d, ...updates } : d
    );

    this.updateState({
      devices: updatedDevices
    });

    // Update calculations
    this.updateTotalValue();
    this.calculateSavings();

    // Save to LocalStorage
    this.saveDemoToLocal();
  }

  /**
   * Upload a photo for analysis
   */
  async uploadPhoto(file: File): Promise<void> {
    this.updateState({
      currentPhoto: file
    });

    this.trackEngagement('uploadPhoto');
    this.saveDemoToLocal();
  }

  /**
   * Set photo analysis results
   */
  setPhotoAnalysisResult(result: PhotoAnalysisResult): void {
    this.updateState({
      photoAnalysisResult: result
    });

    this.saveDemoToLocal();
  }

  /**
   * Apply photo analysis results to create a new device
   */
  applyPhotoResults(): void {
    const currentState = this.getCurrentState();
    const result = currentState.photoAnalysisResult;

    if (!result) {
      return;
    }

    const newDevice: Partial<DemoDevice> = {
      name: `${result.brand} ${result.model}`,
      category: 'other', // Default, user can change
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyMonths: 12,
      purchasePrice: 0,
      photoUrl: currentState.currentPhoto ? URL.createObjectURL(currentState.currentPhoto) : undefined
    };

    this.addDevice(newDevice);

    // Clear photo analysis state
    this.updateState({
      currentPhoto: undefined,
      photoAnalysisResult: undefined
    });
  }

  /**
   * Calculate total purchase value of all devices
   */
  updateTotalValue(): void {
    const currentState = this.getCurrentState();
    const total = currentState.devices.reduce((sum, device) => sum + device.purchasePrice, 0);

    this.updateState({
      totalPurchaseValue: total
    });
  }

  /**
   * Calculate potential savings from warranty management
   */
  calculateSavings(): void {
    const currentState = this.getCurrentState();

    // Conservative estimate: 10% of purchase value could be saved
    // in avoided repair costs by having organized warranty info
    const savings = Math.floor(currentState.totalPurchaseValue * 0.1);

    this.updateState({
      potentialSavings: savings
    });
  }

  /**
   * Track engagement action and update score
   */
  trackEngagement(action: keyof typeof this.ENGAGEMENT_WEIGHTS): void {
    const currentState = this.getCurrentState();
    let newScore = currentState.engagementScore;

    // Add points for this action
    const points = this.ENGAGEMENT_WEIGHTS[action] || 0;
    newScore = Math.min(100, newScore + points);

    // Determine if save CTA should show (threshold: 25 points = 1 device added)
    const showSaveCTA = newScore >= 25;

    this.updateState({
      engagementScore: newScore,
      showSaveCTA: showSaveCTA,
      // Update specific tracking flags
      photoUploaded: action === 'uploadPhoto' ? true : currentState.photoUploaded,
      calculatorUsed: action === 'useCalculator' ? true : currentState.calculatorUsed,
      comparisonViewed: action === 'viewComparison' ? true : currentState.comparisonViewed
    });

    this.saveDemoToLocal();
  }

  /**
   * Mark calculator as used
   */
  markCalculatorUsed(): void {
    this.trackEngagement('useCalculator');
  }

  /**
   * Mark comparison slider as viewed
   */
  markComparisonViewed(): void {
    this.trackEngagement('viewComparison');
  }

  /**
   * Check if save CTA should be shown
   */
  shouldShowSaveCTA(): boolean {
    return this.getCurrentState().showSaveCTA;
  }

  /**
   * Get engagement score (0-100)
   */
  getEngagementScore(): number {
    return this.getCurrentState().engagementScore;
  }

  /**
   * Save demo state to LocalStorage
   */
  saveDemoToLocal(): void {
    try {
      const currentState = this.getCurrentState();

      // Create a serializable version (exclude File objects)
      const serializableState = {
        ...currentState,
        currentPhoto: undefined, // Can't serialize File
        devices: currentState.devices.map(d => ({
          ...d,
          photoUrl: undefined // Don't persist blob URLs
        }))
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializableState));
    } catch (error) {
      console.warn('Failed to save demo state to LocalStorage:', error);
    }
  }

  /**
   * Load demo state from LocalStorage
   */
  loadDemoFromLocal(): DemoState | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) {
        return null;
      }

      const parsed = JSON.parse(saved);
      return {
        ...this.getInitialState(),
        ...parsed
      };
    } catch (error) {
      console.warn('Failed to load demo state from LocalStorage:', error);
      return null;
    }
  }

  /**
   * Transfer demo data to user's real account
   * Called after successful signup
   */
  async transferToAccount(): Promise<void> {
    // This will be implemented when integrating with the signup flow
    // For now, just clear the demo data
    this.clearDemo();
  }

  /**
   * Clear all demo data
   */
  clearDemo(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear demo state from LocalStorage:', error);
    }

    this.demoState.next(this.getInitialState());
  }

  /**
   * Reset demo to initial state (but keep in LocalStorage for recovery)
   */
  resetDemo(): void {
    this.demoState.next(this.getInitialState());
    this.saveDemoToLocal();
  }

  /**
   * Get initial state
   */
  private getInitialState(): DemoState {
    return {
      devices: [],
      currentPhoto: undefined,
      photoAnalysisResult: undefined,
      totalPurchaseValue: 0,
      potentialSavings: 0,
      photoUploaded: false,
      calculatorUsed: false,
      comparisonViewed: false,
      engagementScore: 0,
      showSaveCTA: false
    };
  }

  /**
   * Update state (immutable)
   */
  private updateState(updates: Partial<DemoState>): void {
    const currentState = this.getCurrentState();
    this.demoState.next({
      ...currentState,
      ...updates
    });
  }

  /**
   * Generate unique device ID for demo
   */
  private generateDeviceId(): string {
    return `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
