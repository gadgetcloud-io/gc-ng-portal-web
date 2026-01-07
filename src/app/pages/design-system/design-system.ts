import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Import all design system components
import { ButtonComponent } from '../../shared/components/button/button';
import { CardComponent } from '../../shared/components/card/card';
import { BadgeComponent } from '../../shared/components/badge/badge';
import { AlertComponent } from '../../shared/components/alert/alert';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton';
import { InputComponent } from '../../shared/components/input/input';
import { CheckboxComponent } from '../../shared/components/checkbox/checkbox';
import { TooltipComponent } from '../../shared/components/tooltip/tooltip';
import { DropdownComponent, DropdownItem } from '../../shared/components/dropdown/dropdown';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-design-system',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    BadgeComponent,
    AlertComponent,
    LoadingSpinnerComponent,
    SkeletonComponent,
    InputComponent,
    CheckboxComponent,
    TooltipComponent,
    DropdownComponent,
    EmptyStateComponent
  ],
  templateUrl: './design-system.html',
  styleUrl: './design-system.scss'
})
export class DesignSystemComponent {
  // Input demo values
  emailInput = '';
  passwordInput = '';
  disabledInput = 'Cannot edit this';

  // Checkbox demo values
  checkbox1 = false;
  checkbox2 = true;
  checkbox3 = false;
  indeterminateCheckbox = true;

  // Dropdown demo
  dropdownItems: DropdownItem[] = [
    { label: 'Edit', value: 'edit', icon: '✏️' },
    { label: 'Duplicate', value: 'duplicate', icon: '📋' },
    { label: 'Archive', value: 'archive', icon: '📦' },
    { divider: true },
    { label: 'Delete', value: 'delete', icon: '🗑️' }
  ];

  selectedDropdownItem: string = '';

  // Alert visibility
  showSuccessAlert = true;
  showWarningAlert = true;
  showErrorAlert = true;
  showInfoAlert = true;

  // Methods
  handleButtonClick(variant: string) {
    console.log(`${variant} button clicked`);
  }

  handleDropdownSelect(item: DropdownItem) {
    this.selectedDropdownItem = item.label || '';
    console.log('Selected:', item);
  }

  handleEmptyStateAction() {
    console.log('Empty state action clicked');
  }

  handleAlertDismiss(type: string) {
    switch(type) {
      case 'success':
        this.showSuccessAlert = false;
        break;
      case 'warning':
        this.showWarningAlert = false;
        break;
      case 'error':
        this.showErrorAlert = false;
        break;
      case 'info':
        this.showInfoAlert = false;
        break;
    }
  }
}
