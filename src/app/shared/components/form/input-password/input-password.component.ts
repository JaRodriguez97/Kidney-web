import { Component, Input, forwardRef, Self, Optional, inject } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl,
} from '@angular/forms';

@Component({
  selector: 'app-input-password',
  standalone: true,
  imports: [],
  templateUrl: './input-password.component.html',
  styleUrl: './input-password.component.scss',
})
export class InputPasswordComponent implements ControlValueAccessor {
  @Input() label: string = 'Contraseña*';
  @Input() placeholder: string = '••••••••';
  @Input() disabled = false;
  @Input() icon?: string;

  value: string = '';
  showPassword = false;
  required: any;

  ngControl = inject(NgControl, { self: true, optional: true });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  onChange = (value: any) => {};
  onTouched = () => {};

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  toggleVisibility() {
    this.showPassword = !this.showPassword;
  }

  get control() {
    return this.ngControl?.control;
  }

  get showError() {
    return this.control?.invalid && this.control?.touched;
  }

  get inputType() {
    return this.showPassword ? 'text' : 'password';
  }
}
