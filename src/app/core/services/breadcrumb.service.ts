import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface DynamicBreadcrumb {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  private dynamicLabelsSubject = new BehaviorSubject<DynamicBreadcrumb>({});

  dynamicLabels$: Observable<DynamicBreadcrumb> = this.dynamicLabelsSubject.asObservable();

  /**
   * Set a dynamic breadcrumb label
   * @param key - Route path or identifier
   * @param label - Label to display
   */
  setLabel(key: string, label: string): void {
    const currentLabels = this.dynamicLabelsSubject.value;
    this.dynamicLabelsSubject.next({
      ...currentLabels,
      [key]: label
    });
  }

  /**
   * Get a dynamic breadcrumb label
   * @param key - Route path or identifier
   */
  getLabel(key: string): string | undefined {
    return this.dynamicLabelsSubject.value[key];
  }

  /**
   * Clear all dynamic labels
   */
  clearLabels(): void {
    this.dynamicLabelsSubject.next({});
  }

  /**
   * Remove a specific label
   * @param key - Route path or identifier
   */
  removeLabel(key: string): void {
    const currentLabels = { ...this.dynamicLabelsSubject.value };
    delete currentLabels[key];
    this.dynamicLabelsSubject.next(currentLabels);
  }
}
