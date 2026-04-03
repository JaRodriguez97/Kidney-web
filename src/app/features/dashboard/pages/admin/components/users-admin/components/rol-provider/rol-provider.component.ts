import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { ProviderTypeService } from '@app/core/services/provider-type.service';
import { ProviderType } from '@app/domains/user/provider-type.entity';

@Component({
	selector: 'app-rol-provider',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './rol-provider.component.html',
	styleUrl: './rol-provider.component.scss',
})
export class RolProviderComponent implements OnInit {
	providerForm!: FormGroup;
	isSubmitting = false;
	successMessage = '';
	errorMessage = '';
	showPassword = false;

	providerTypes: ProviderType[] = [];
	isLoadingProviderTypes = false;

	@Output() formDataChange = new EventEmitter<any>();

	constructor(
		private fb: FormBuilder,
		private providerTypeService: ProviderTypeService,
	) {}

	ngOnInit(): void {
		this.initializeForm();
		this.loadProviderTypes();
	}

	initializeForm(): void {
		this.providerForm = this.fb.group({
			// Obligatorios
			email: ['', [Validators.required, Validators.email]],
			password: ['', [Validators.required, Validators.minLength(8)]],
			firstName: ['', [Validators.required, Validators.minLength(2)]],
			lastName: ['', [Validators.required, Validators.minLength(2)]],
			providerTypeId: ['', [Validators.required]],
			documentType: ['CC', [Validators.required]],
			documentNumber: ['', [Validators.required]],

			// Opcionales
			middleName: [''],
			secondLastName: [''],
			phone: [''],
			gender: [''],
			neighborhood: [''],
			address: [''],
			commune: [null],
		});

		this.providerForm.valueChanges.subscribe((value) => {
			this.formDataChange.emit(value);
		});
	}

	loadProviderTypes(): void {
		this.isLoadingProviderTypes = true;
		this.providerTypeService.getProviderTypes().subscribe({
			next: (types) => {
				this.providerTypes = types;
				this.isLoadingProviderTypes = false;
			},
			error: (err) => {
				console.error('Error al cargar tipos de proveedor:', err);
				this.isLoadingProviderTypes = false;
			},
		});
	}

	getFormData(): any {
		const formData = this.providerForm.value;
		const data: any = {
			email: formData.email,
			password: formData.password,
			firstName: formData.firstName,
			lastName: formData.lastName,
			providerTypeId: formData.providerTypeId,
			documentType: formData.documentType,
			documentNumber: formData.documentNumber,
		};

		if (formData.middleName) data.middleName = formData.middleName;
		if (formData.secondLastName) data.secondLastName = formData.secondLastName;
		if (formData.phone) data.phone = formData.phone;
		if (formData.gender) data.gender = formData.gender;
		if (formData.neighborhood) data.neighborhood = formData.neighborhood;
		if (formData.address) data.address = formData.address;
		if (formData.commune) data.commune = formData.commune;

		return data;
	}

	resetForm(): void {
		this.providerForm.reset({ documentType: 'CC', commune: null });
		this.successMessage = '';
		this.errorMessage = '';
		this.showPassword = false;
	}

	togglePasswordVisibility(): void {
		this.showPassword = !this.showPassword;
	}
}
