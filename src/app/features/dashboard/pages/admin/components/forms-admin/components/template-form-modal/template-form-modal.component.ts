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
import { InputTextComponent } from '@app/shared/components/form/input-text/input-text.component';
import { TextareaComponent } from '@app/shared/components/form/textarea/textarea.component';

export interface TemplateFormModalSubmit {
	code: string;
	name: string;
	description: string | null;
}

@Component({
	selector: 'app-template-form-modal',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		InputTextComponent,
		TextareaComponent,
	],
	templateUrl: './template-form-modal.component.html',
})
export class TemplateFormModalComponent implements OnChanges {
	private readonly fb = inject(FormBuilder);

	@Input() visible = false;
	@Input() mode: 'create' | 'edit' = 'create';
	@Input() loading = false;
	@Input() initialData: {
		code: string;
		name: string;
		description: string | null;
	} | null = null;

	@Output() close = new EventEmitter<void>();
	@Output() save = new EventEmitter<TemplateFormModalSubmit>();

	readonly form = this.fb.group({
		code: this.fb.nonNullable.control('', [
			Validators.required,
			Validators.minLength(3),
			Validators.maxLength(50),
		]),
		name: this.fb.nonNullable.control('', [
			Validators.required,
			Validators.minLength(3),
			Validators.maxLength(150),
		]),
		description: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
	});

	ngOnChanges(changes: SimpleChanges): void {
		const visibleChange = changes['visible'];
		if (!visibleChange) {
			return;
		}

		if (!visibleChange.currentValue) {
			return;
		}

		const initial = this.initialData;
		this.form.reset({
			code: initial?.code ?? '',
			name: initial?.name ?? '',
			description: initial?.description ?? '',
		});

		if (this.mode === 'edit') {
			this.form.controls.code.disable({ emitEvent: false });
		} else {
			this.form.controls.code.enable({ emitEvent: false });
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
		this.save.emit({
			code: raw.code.trim(),
			name: raw.name.trim(),
			description: raw.description.trim() ? raw.description.trim() : null,
		});
	}
}
