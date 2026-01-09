import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Activity, ActivityStats, ActivityService } from '../../core/services/activity.service';
import { ButtonComponent } from '../../shared/components/button/button';
import { CardComponent } from '../../shared/components/card/card';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';

@Component({
  selector: 'app-activity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    SkeletonComponent
  ],
  templateUrl: './activity.html',
  styleUrl: './activity.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityComponent implements OnInit, OnDestroy {
  // Data
  activities: Activity[] = [];
  activityStats: ActivityStats | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalActivities = 0;
  totalPages = 0;

  // Filters
  selectedEventType = 'all';
  selectedDateRange = '30_days';
  searchTerm = '';

  // UI State
  isLoading = false;
  isLoadingStats = false;
  errorMessage = '';

  // Filter Options
  eventTypeOptions = [
    { value: 'all', label: 'All Activity' },
    { value: 'item', label: 'Devices' },
    { value: 'ticket', label: 'Service Tickets' },
    { value: 'document', label: 'Documents' },
    { value: 'auth', label: 'Account' }
  ];

  dateRangeOptions = [
    { value: '7_days', label: 'Last 7 days' },
    { value: '30_days', label: 'Last 30 days' },
    { value: '90_days', label: 'Last 90 days' },
    { value: 'all_time', label: 'All time' }
  ];

  private subscriptions = new Subscription();

  constructor(
    private activityService: ActivityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadActivityStats();
    this.loadActivities();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Load activity statistics
   */
  private loadActivityStats(): void {
    this.isLoadingStats = true;

    const statsSub = this.activityService.getMyActivityStats().subscribe({
      next: (stats) => {
        this.activityStats = stats;
        this.isLoadingStats = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading activity stats:', error);
        this.isLoadingStats = false;
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.add(statsSub);
  }

  /**
   * Load activities with current filters and pagination
   */
  loadActivities(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const offset = (this.currentPage - 1) * this.pageSize;
    const dateFilter = this.getDateRangeFilter(this.selectedDateRange);

    const activitiesSub = this.activityService.getMyActivity(
      this.pageSize,
      offset,
      this.selectedEventType,
      dateFilter.startDate,
      dateFilter.endDate
    ).subscribe({
      next: (activities) => {
        this.activities = activities;
        this.isLoading = false;
        this.cdr.markForCheck();

        // Load total count for pagination
        this.loadActivityCount();
      },
      error: (error) => {
        console.error('Error loading activities:', error);
        this.errorMessage = 'Failed to load activity. Please try again.';
        this.isLoading = false;
        this.activities = [];
        this.cdr.markForCheck();
      }
    });

    this.subscriptions.add(activitiesSub);
  }

  /**
   * Load total activity count
   */
  private loadActivityCount(): void {
    const countSub = this.activityService.getMyActivityCount(this.selectedEventType).subscribe({
      next: (count) => {
        this.totalActivities = count;
        this.totalPages = Math.ceil(count / this.pageSize);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading activity count:', error);
      }
    });

    this.subscriptions.add(countSub);
  }

  /**
   * Get date range filter based on selected range
   */
  private getDateRangeFilter(range: string): { startDate?: string, endDate?: string } {
    const now = new Date();
    let startDate: Date | undefined;

    switch (range) {
      case '7_days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30_days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90_days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all_time':
        startDate = undefined;
        break;
    }

    return {
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: now.toISOString()
    };
  }

  /**
   * Get filtered activities based on search term
   */
  get filteredActivities(): Activity[] {
    if (!this.searchTerm) {
      return this.activities;
    }

    const term = this.searchTerm.toLowerCase();
    return this.activities.filter(activity =>
      activity.description.toLowerCase().includes(term) ||
      activity.eventType.toLowerCase().includes(term)
    );
  }

  /**
   * Handle event type filter change
   */
  onEventTypeChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadActivities();
    this.loadActivityStats(); // Reload stats for selected type
  }

  /**
   * Handle date range filter change
   */
  onDateRangeChange(): void {
    this.currentPage = 1; // Reset to first page
    this.loadActivities();
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadActivities();

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Handle refresh button click
   */
  onRefresh(): void {
    this.loadActivityStats();
    this.loadActivities();
  }

  /**
   * Get page numbers for pagination
   */
  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Format timestamp for display (with tooltip showing absolute time)
   */
  getAbsoluteTime(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }
}
