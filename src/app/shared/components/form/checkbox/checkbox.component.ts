import { Component, Input, inject } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Component({
	selector: 'app-checkbox',
	standalone: true,
	imports: [],
	templateUrl: './checkbox.component.html',
	styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent implements ControlValueAccessor {
	@Input() label = 'Checkbox';
	@Input() description = '';
	@Input() disabled = false;

	value = false;

	ngControl = inject(NgControl, { self: true, optional: true });

	constructor() {
		if (this.ngControl) {
			this.ngControl.valueAccessor = this;
		}
	}

	onChange = (value: boolean) => {};
	onTouched = () => {};

	writeValue(value: unknown): void {
		this.value = Boolean(value);
	}

	registerOnChange(fn: (value: boolean) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
	}

	handleChange(event: Event): void {
		const checked = (event.target as HTMLInputElement).checked;
		this.value = checked;
		this.onChange(checked);
		this.onTouched();
	}

	get control() {
		return this.ngControl?.control;
	}

	get showError() {
		return this.control?.invalid && this.control?.touched;
	}
}
