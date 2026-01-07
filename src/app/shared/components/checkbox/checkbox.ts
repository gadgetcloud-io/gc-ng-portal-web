import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type CheckboxSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'gc-checkbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checkbox.html',
  styleUrl: './checkbox.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ]
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() size: CheckboxSize = 'md';
  @Input() disabled = false;
  @Input() indeterminate = false;
  @Output() onChange = new EventEmitter<boolean>();

  checked = false;

  // ControlValueAccessor implementation
  onChangeFn: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this.checked = value || false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(event: Event): void {
    if (this.disabled) {
      event.preventDefault();
      return;
    }

    const input = event.target as HTMLInputElement;
    this.checked = input.checked;
    this.indeterminate = false;
    this.onChangeFn(this.checked);
    this.onChange.emit(this.checked);
  }

  handleBlur(): void {
    this.onTouched();
  }

  get checkboxClasses(): string {
    const classes = ['checkbox', `checkbox-${this.size}`];

    if (this.checked) {
      classes.push('checkbox-checked');
    }

    if (this.indeterminate) {
      classes.push('checkbox-indeterminate');
    }

    if (this.disabled) {
      classes.push('checkbox-disabled');
    }

    return classes.join(' ');
  }
}
