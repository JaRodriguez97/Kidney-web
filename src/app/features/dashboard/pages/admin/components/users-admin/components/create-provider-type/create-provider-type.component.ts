import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { ProviderTypeService } from '@app/core/services/provider-type.service';
import { CreateProviderTypeRequest } from '@app/domains/user/provider-type.entity';

@Component({
	selector: 'app-create-provider-type',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './create-provider-type.component.html',
	styleUrl: './create-provider-type.component.scss',
})
export class CreateProviderTypeComponent {
	@Input() visible = false;
	@Output() close = new EventEmitter<void>();
	@Output() created = new EventEmitter<void>();

	form!: FormGroup;
	isSubmitting = false;

	constructor(
		private fb: FormBuilder,
		private providerTypeService: ProviderTypeService,
	) {
		this.form = this.fb.group({
			code: [
				'',
				[
					Validators.required,
					Validators.maxLength(50),
					Validators.pattern(/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/),
				],
			],
			name: [
				'',
				[
					Validators.required,
					Validators.minLength(1),
					Validators.maxLength(150),
				],
			],
			description: [''],
			requiresProfessionalLicense: [true],
			permissionIds: [[] as string[]],
		});
	}

	onSubmit(): void {
		if (this.form.invalid) return;

		this.isSubmitting = true;

		const request: CreateProviderTypeRequest = {
			code: this.form.value.code,
			name: this.form.value.name,
			description: this.form.value.description || undefined,
			requiresProfessionalLicense: this.form.value.requiresProfessionalLicense,
			permissionIds: this.form.value.permissionIds,
		};

		this.providerTypeService.createProviderType(request).subscribe({
			next: () => {
				this.isSubmitting = false;
				this.form.reset({
					requiresProfessionalLicense: true,
					permissionIds: [],
				});
				this.created.emit();
				this.close.emit();
			},
			error: (err) => {
				console.error('Error al crear tipo de proveedor:', err);
				this.isSubmitting = false;
			},
		});
	}

	onCancel(): void {
		this.form.reset({ requiresProfessionalLicense: true, permissionIds: [] });
		this.close.emit();
	}
}
