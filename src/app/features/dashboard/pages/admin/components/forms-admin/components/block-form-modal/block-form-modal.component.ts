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
import { EngineFormAdminFieldCatalogItem } from '@app/core/services/engine-form-admin.service';
import { InputNumberComponent } from '@app/shared/components/form/input-number/input-number.component';
import { InputTextComponent } from '@app/shared/components/form/input-text/input-text.component';
import { TextareaComponent } from '@app/shared/components/form/textarea/textarea.component';

export interface BlockFormModalSubmit {
	code: string | null;
	name: string;
	description: string | null;
	sortOrder: number;
	selectedFieldIds?: string[];
}

@Component({
	selector: 'app-block-form-modal',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		InputTextComponent,
		TextareaComponent,
		InputNumberComponent,
	],
	templateUrl: './block-form-modal.component.html',
})
export class BlockFormModalComponent implements OnChanges {
	private readonly fb = inject(FormBuilder);

	@Input() visible = false;
	@Input() mode: 'create' | 'edit' = 'create';
	@Input() loading = false;
	@Input() availableFields: EngineFormAdminFieldCatalogItem[] = [];
	@Input() initialData: {
		code: string | null;
		name: string;
		description: string | null;
		sortOrder: number;
		selectedFieldIds?: string[];
	} | null = null;

	@Output() close = new EventEmitter<void>();
	@Output() save = new EventEmitter<BlockFormModalSubmit>();

	readonly form = this.fb.group({
		code: this.fb.nonNullable.control('', [Validators.maxLength(50)]),
		name: this.fb.nonNullable.control('', [
			Validators.required,
			Validators.minLength(3),
			Validators.maxLength(150),
		]),
		description: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
		sortOrder: this.fb.nonNullable.control(1, [
			Validators.required,
			Validators.min(1),
		]),
	});

	selectedFieldIds = new Set<string>();

	ngOnChanges(changes: SimpleChanges): void {
		const visibleChange = changes['visible'];
		if (!visibleChange) {
			return;
		}

		if (!visibleChange.currentValue) {
			return;
		}

		this.form.reset({
			code: this.initialData?.code ?? '',
			name: this.initialData?.name ?? '',
			description: this.initialData?.description ?? '',
			sortOrder: this.initialData?.sortOrder ?? 1,
		});

		this.selectedFieldIds = new Set(this.initialData?.selectedFieldIds ?? []);

		if (this.mode === 'edit') {
			this.form.controls.code.disable({ emitEvent: false });
		} else {
			this.form.controls.code.enable({ emitEvent: false });
		}
	}

	trackByAvailableField(
		_: number,
		field: EngineFormAdminFieldCatalogItem,
	): string {
		return field.id;
	}

	isFieldSelected(fieldId: string): boolean {
		return this.selectedFieldIds.has(fieldId);
	}

	toggleFieldSelection(fieldId: string, checked: boolean): void {
		if (checked) {
			this.selectedFieldIds.add(fieldId);
			return;
		}

		this.selectedFieldIds.delete(fieldId);
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
			code: raw.code.trim() ? raw.code.trim() : null,
			name: raw.name.trim(),
			description: raw.description.trim() ? raw.description.trim() : null,
			sortOrder: Number(raw.sortOrder),
			selectedFieldIds:
				this.mode === 'create' ? Array.from(this.selectedFieldIds) : undefined,
		});
	}
}
