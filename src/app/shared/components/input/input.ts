import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'success' | 'warning' | 'error';

@Component({
  selector: 'gc-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input.html',
  styleUrl: './input.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' = 'text';
  @Input() size: InputSize = 'md';
  @Input() state: InputState = 'default';
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() helperText?: string;
  @Input() errorText?: string;
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;
  @Input() disabled = false;
  @Input() required = false;
  @Input() readonly = false;
  @Output() onBlur = new EventEmitter<FocusEvent>();
  @Output() onFocus = new EventEmitter<FocusEvent>();

  value = '';
  isFocused = false;

  // ControlValueAccessor implementation
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  handleFocus(event: FocusEvent): void {
    this.isFocused = true;
    this.onFocus.emit(event);
  }

  handleBlur(event: FocusEvent): void {
    this.isFocused = false;
    this.onTouched();
    this.onBlur.emit(event);
  }

  get containerClasses(): string {
    return 'input-container';
  }

  get inputClasses(): string {
    const classes = [
      'input',
      `input-${this.size}`,
      `input-${this.state}`
    ];

    if (this.prefixIcon) {
      classes.push('input-has-prefix');
    }

    if (this.suffixIcon) {
      classes.push('input-has-suffix');
    }

    if (this.isFocused) {
      classes.push('input-focused');
    }

    return classes.join(' ');
  }

  get displayHelperText(): string | undefined {
    return this.errorText || this.helperText;
  }

  get helperTextClass(): string {
    return this.errorText ? 'helper-text-error' : 'helper-text';
  }
}
