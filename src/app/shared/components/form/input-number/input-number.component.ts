import { Component, Input, inject } from '@angular/core';
import {
  ControlValueAccessor,
  NgControl
} from '@angular/forms';

@Component({
  selector: 'app-input-number',
  standalone: true,
  imports: [],
  templateUrl: './input-number.component.html',
  styleUrl: './input-number.component.scss',
})
export class InputNumberComponent implements ControlValueAccessor {
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() icon?: string;
  @Input() min?: number;
  @Input() max?: number;
  @Input() step: number = 1;

  value: number | null = null;
  disabled = false;

  ngControl = inject(NgControl, { self: true, optional: true });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  onChange = (value: number | null) => {};
  onTouched = () => {};

  writeValue(value: number | null): void {
    this.value = value;
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
    const raw = (event.target as HTMLInputElement).value;

    if (raw === '') {
      this.value = null;
      this.onChange(null);
      return;
    }

    const numericValue = Number(raw);
    this.value = numericValue;
    this.onChange(numericValue);
  }

  get control() {
    return this.ngControl?.control;
  }

  get showError() {
    return this.control?.invalid && this.control?.touched;
  }
}
