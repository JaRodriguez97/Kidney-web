import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
	EngineFormRenderableField,
	EngineFormFieldType,
} from '@app/core/services/engine-form.service';
import { CheckboxComponent } from '@app/shared/components/form/checkbox/checkbox.component';
import { InputNumberComponent } from '@app/shared/components/form/input-number/input-number.component';
import { InputTextComponent } from '@app/shared/components/form/input-text/input-text.component';
import { SelectComponent } from '@app/shared/components/form/select/select.component';
import { TextareaComponent } from '@app/shared/components/form/textarea/textarea.component';

@Component({
	selector: 'app-dynamic-engine-field',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		InputTextComponent,
		InputNumberComponent,
		TextareaComponent,
		SelectComponent,
		CheckboxComponent,
	],
	templateUrl: './dynamic-engine-field.component.html',
	styleUrl: './dynamic-engine-field.component.scss',
})
export class DynamicEngineFieldComponent {
	@Input({ required: true }) field!: EngineFormRenderableField;
	@Input({ required: true }) control!: FormControl;

	onToggleMulti(optionId: string, checked: boolean): void {
		if (this.field.isReadonly || this.control.disabled) {
			return;
		}

		const currentValue = Array.isArray(this.control.value)
			? ([...this.control.value] as string[])
			: [];

		if (checked && !currentValue.includes(optionId)) {
			currentValue.push(optionId);
		}

		if (!checked) {
			const next = currentValue.filter((value) => value !== optionId);
			this.control.setValue(next);
			this.control.markAsTouched();
			return;
		}

		this.control.setValue(currentValue);
		this.control.markAsTouched();
	}

	onSelectRadio(optionId: string): void {
		if (this.field.isReadonly || this.control.disabled) {
			return;
		}

		this.control.setValue(optionId);
		this.control.markAsTouched();
	}

	isMultiSelected(optionId: string): boolean {
		const currentValue = this.control.value;
		if (!Array.isArray(currentValue)) {
			return false;
		}

		return currentValue.includes(optionId);
	}

	isWideField(fieldType: EngineFormFieldType): boolean {
		return fieldType === 'TEXTAREA';
	}

	get showError(): boolean {
		return this.control.invalid && this.control.touched;
	}
}
