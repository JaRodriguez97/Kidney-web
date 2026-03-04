import {
  Component,
  Input,
  forwardRef,
  Self,
  Optional,
  inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NgControl,
} from '@angular/forms';

@Component({
  selector: 'app-input-email',
  standalone: true,
  imports: [],
  templateUrl: './input-email.component.html',
  styleUrl: './input-email.component.scss',
})
export class InputEmailComponent implements ControlValueAccessor {
  @Input() disabled: boolean = false;
  @Input() icon?: string;

  readonly label: string = 'Correo electrónico*';
  readonly placeholder: string = 'correo@ejemplo.com';
  value: string = '';

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
    this.onTouched();
  }

  get control() {
    return this.ngControl?.control;
  }

  get showError() {
    return this.control?.invalid && this.control?.touched;
  }
}
