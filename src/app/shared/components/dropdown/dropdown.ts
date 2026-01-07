import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DropdownPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
export type DropdownSize = 'sm' | 'md' | 'lg';

export interface DropdownItem {
  label?: string;
  value?: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

@Component({
  selector: 'gc-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown.html',
  styleUrl: './dropdown.scss'
})
export class DropdownComponent {
  @Input() items: DropdownItem[] = [];
  @Input() position: DropdownPosition = 'bottom-left';
  @Input() size: DropdownSize = 'md';
  @Input() triggerText = 'Options';
  @Input() triggerIcon = '▼';
  @Input() disabled = false;
  @Input() fullWidth = false;

  @Output() onSelect = new EventEmitter<DropdownItem>();

  isOpen = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.isOpen = false;
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
  }

  selectItem(item: DropdownItem) {
    if (item.disabled) return;

    this.onSelect.emit(item);
    this.isOpen = false;
  }

  get dropdownClasses(): string {
    const classes = ['dropdown'];

    if (this.fullWidth) {
      classes.push('dropdown-fullwidth');
    }

    if (this.disabled) {
      classes.push('dropdown-disabled');
    }

    return classes.join(' ');
  }

  get triggerClasses(): string {
    const classes = ['dropdown-trigger', `dropdown-trigger-${this.size}`];

    if (this.isOpen) {
      classes.push('dropdown-trigger-open');
    }

    if (this.disabled) {
      classes.push('dropdown-trigger-disabled');
    }

    return classes.join(' ');
  }

  get menuClasses(): string {
    const classes = [
      'dropdown-menu',
      `dropdown-menu-${this.position}`,
      `dropdown-menu-${this.size}`
    ];

    if (this.isOpen) {
      classes.push('dropdown-menu-open');
    }

    return classes.join(' ');
  }
}
