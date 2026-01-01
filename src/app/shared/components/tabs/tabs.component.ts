import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  count?: number;
  disabled?: boolean;
}

@Component({
  selector: 'gc-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss'
})
export class TabsComponent {
  @Input() tabs: Tab[] = [];
  @Input() activeTabId: string = '';
  @Input() variant: 'default' | 'pills' | 'underline' = 'underline';
  @Output() tabChange = new EventEmitter<string>();

  private focusedTabIndex: number = -1;

  ngOnInit(): void {
    // Set initial focused tab to active tab
    this.focusedTabIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
  }

  ngOnChanges(): void {
    // Update focused tab index when active tab changes
    this.focusedTabIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
  }

  selectTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab && !tab.disabled) {
      this.activeTabId = tabId;
      this.focusedTabIndex = this.tabs.findIndex(t => t.id === tabId);
      this.tabChange.emit(tabId);
    }
  }

  isActive(tabId: string): boolean {
    return this.activeTabId === tabId;
  }

  @HostListener('keydown', ['$event'])
  handleKeyboardNavigation(event: KeyboardEvent): void {
    const enabledTabs = this.tabs.filter(tab => !tab.disabled);
    const currentEnabledIndex = enabledTabs.findIndex(tab => tab.id === this.activeTabId);

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.navigateToPreviousTab(enabledTabs, currentEnabledIndex);
        break;

      case 'ArrowRight':
        event.preventDefault();
        this.navigateToNextTab(enabledTabs, currentEnabledIndex);
        break;

      case 'Home':
        event.preventDefault();
        if (enabledTabs.length > 0) {
          this.selectTab(enabledTabs[0].id);
        }
        break;

      case 'End':
        event.preventDefault();
        if (enabledTabs.length > 0) {
          this.selectTab(enabledTabs[enabledTabs.length - 1].id);
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        // Tab is already selected on focus, just ensure it's active
        if (this.focusedTabIndex >= 0 && this.focusedTabIndex < this.tabs.length) {
          const focusedTab = this.tabs[this.focusedTabIndex];
          if (!focusedTab.disabled) {
            this.selectTab(focusedTab.id);
          }
        }
        break;
    }
  }

  private navigateToPreviousTab(enabledTabs: Tab[], currentIndex: number): void {
    if (enabledTabs.length === 0) return;

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1;
    this.selectTab(enabledTabs[prevIndex].id);
  }

  private navigateToNextTab(enabledTabs: Tab[], currentIndex: number): void {
    if (enabledTabs.length === 0) return;

    const nextIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0;
    this.selectTab(enabledTabs[nextIndex].id);
  }

  getTabAriaLabel(tab: Tab): string {
    let label = tab.label;
    if (tab.count !== undefined) {
      label += ` (${tab.count})`;
    }
    if (tab.disabled) {
      label += ' - Disabled';
    }
    return label;
  }

  trackByTabId(index: number, tab: Tab): string {
    return tab.id;
  }

  get indicatorTransform(): string {
    const activeIndex = this.tabs.findIndex(t => t.id === this.activeTabId);
    return `translateX(${activeIndex * 100}%)`;
  }
}
