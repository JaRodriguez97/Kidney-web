import { CommonModule } from '@angular/common';
import {
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges,
	inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EngineFormFieldType } from '@app/core/services/engine-form-admin.service';
import { CheckboxComponent } from '@app/shared/components/form/checkbox/checkbox.component';
import { InputNumberComponent } from '@app/shared/components/form/input-number/input-number.component';
import { InputTextComponent } from '@app/shared/components/form/input-text/input-text.component';
import { SelectComponent } from '@app/shared/components/form/select/select.component';
import { TextareaComponent } from '@app/shared/components/form/textarea/textarea.component';

export interface FieldFormModalSubmit {
	code: string | null;
	label: string;
	fieldType: EngineFormFieldType;
	placeholder: string | null;
	isRequired: boolean;
	sortOrder: number;
	options?: Array<{
		code?: string;
		label: string;
		value?: string;
		sortOrder?: number;
	}>;
}

@Component({
	selector: 'app-field-form-modal',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		InputTextComponent,
		TextareaComponent,
		SelectComponent,
		InputNumberComponent,
		CheckboxComponent,
	],
	templateUrl: './field-form-modal.component.html',
})
export class FieldFormModalComponent implements OnChanges {
	private readonly fb = inject(FormBuilder);

	readonly fieldTypes: EngineFormFieldType[] = [
		'TEXT',
		'TEXTAREA',
		'NUMBER',
		'DATE',
		'DATETIME',
		'SELECT',
		'MULTISELECT',
		'CHECKBOX',
		'RADIO',
	];

	readonly fieldTypeOptions = this.fieldTypes.map((fieldType) => ({
		label: fieldType,
		value: fieldType,
	}));

	@Input() visible = false;
	@Input() mode: 'create' | 'edit' = 'create';
	@Input() loading = false;
	@Input() initialData: {
		code: string | null;
		label: string;
		fieldType: EngineFormFieldType;
		placeholder: string | null;
		isRequired: boolean;
		sortOrder: number | null;
		options: Array<{
			label: string;
			value: string | null;
			code: string | null;
		}>;
	} | null = null;

	@Output() close = new EventEmitter<void>();
	@Output() save = new EventEmitter<FieldFormModalSubmit>();

	readonly form = this.fb.group({
		code: this.fb.nonNullable.control('', [Validators.maxLength(50)]),
		label: this.fb.nonNullable.control('', [
			Validators.required,
			Validators.minLength(1),
			Validators.maxLength(150),
		]),
		fieldType: this.fb.nonNullable.control<EngineFormFieldType>('TEXT', [
			Validators.required,
		]),
		placeholder: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
		isRequired: this.fb.nonNullable.control(false),
		sortOrder: this.fb.nonNullable.control(1, [
			Validators.required,
			Validators.min(1),
		]),
		optionsText: this.fb.nonNullable.control(''),
	});

	ngOnChanges(changes: SimpleChanges): void {
		const visibleChange = changes['visible'];
		if (!visibleChange) {
			return;
		}

		if (!visibleChange.currentValue) {
			return;
		}

		const optionsText = (this.initialData?.options ?? [])
			.map((option) => {
				const value = option.value ?? '';
				const code = option.code ?? '';
				return `${option.label}|${value}|${code}`;
			})
			.join('\n');

		this.form.reset({
			code: this.initialData?.code ?? '',
			label: this.initialData?.label ?? '',
			fieldType: this.initialData?.fieldType ?? 'TEXT',
			placeholder: this.initialData?.placeholder ?? '',
			isRequired: this.initialData?.isRequired ?? false,
			sortOrder: this.initialData?.sortOrder ?? 1,
			optionsText,
		});

		if (this.mode === 'edit') {
			this.form.controls.code.disable({ emitEvent: false });
			this.form.controls.fieldType.disable({ emitEvent: false });
			this.form.controls.optionsText.disable({ emitEvent: false });
		} else {
			this.form.controls.code.enable({ emitEvent: false });
			this.form.controls.fieldType.enable({ emitEvent: false });
			this.form.controls.optionsText.enable({ emitEvent: false });
		}
	}

	onClose(): void {
		if (this.loading) {
			return;
		}

		this.close.emit();
	}

	onSubmit(): void {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const raw = this.form.getRawValue();
		const type = raw.fieldType;
		const options = this.parseOptions(raw.optionsText);

		if (
			this.mode === 'create' &&
			this.requiresOptions(type) &&
			options.length === 0
		) {
			this.form.controls.optionsText.setErrors({ requiredOptions: true });
			this.form.controls.optionsText.markAsTouched();
			return;
		}

		this.save.emit({
			code: raw.code.trim() ? raw.code.trim() : null,
			label: raw.label.trim(),
			fieldType: type,
			placeholder: raw.placeholder.trim() ? raw.placeholder.trim() : null,
			isRequired: raw.isRequired,
			sortOrder: Number(raw.sortOrder),
			options: options.length > 0 ? options : undefined,
		});
	}

	requiresOptions(fieldType: EngineFormFieldType): boolean {
		return (
			fieldType === 'SELECT' ||
			fieldType === 'MULTISELECT' ||
			fieldType === 'RADIO'
		);
	}

	private parseOptions(value: string): Array<{
		code?: string;
		label: string;
		value?: string;
		sortOrder?: number;
	}> {
		const lines = value
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line.length > 0);

		return lines.map((line, index) => {
			const [labelChunk, valueChunk, codeChunk] = line
				.split('|')
				.map((part) => part.trim());
			const label = labelChunk || `Opción ${index + 1}`;
			const result: {
				code?: string;
				label: string;
				value?: string;
				sortOrder?: number;
			} = {
				label,
				sortOrder: index + 1,
			};

			if (valueChunk) {
				result.value = valueChunk;
			}

			if (codeChunk) {
				result.code = codeChunk;
			}

			return result;
		});
	}
}
