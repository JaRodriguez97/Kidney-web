import {
	Component,
	OnInit,
	Output,
	EventEmitter,
	ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators,
} from '@angular/forms';
import { ProviderTypeService } from '@app/core/services/provider-type.service';
import { ProviderType } from '@app/domains/user/provider-type.entity';
import { ProviderScheduleFormComponent } from './provider-schedule-form/provider-schedule-form.component';

@Component({
	selector: 'app-rol-provider',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, ProviderScheduleFormComponent],
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
	selectedProviderTypeRequiresLicense = false;
	showScheduleForm = false;

	@ViewChild(ProviderScheduleFormComponent)
	scheduleFormComponent?: ProviderScheduleFormComponent;
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
			professionalLicenseNumber: [''], // Dinámicamente requerido

			// Opcionales
			middleName: [''],
			secondLastName: [''],
			phone: [''],
			gender: [''],
			neighborhood: [''],
			address: [''],
			commune: [null],
		});

		// Suscribirse a cambios de providerTypeId para validación condicional de licencia
		this.providerForm
			.get('providerTypeId')
			?.valueChanges.subscribe((typeId) => {
				if (typeId) {
					const selectedType = this.providerTypes.find(
						(pt) => pt.id === typeId,
					);
					if (selectedType && selectedType.requiresProfessionalLicense) {
						this.selectedProviderTypeRequiresLicense = true;
						this.providerForm
							.get('professionalLicenseNumber')
							?.setValidators([Validators.required]);
					} else {
						this.selectedProviderTypeRequiresLicense = false;
						this.providerForm
							.get('professionalLicenseNumber')
							?.clearValidators();
						this.providerForm.get('professionalLicenseNumber')?.reset('');
					}
					this.providerForm
						.get('professionalLicenseNumber')
						?.updateValueAndValidity();
				}
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
		const scheduleData = this.scheduleFormComponent?.getScheduleData() ?? null;
		const data: any = {
			email: formData.email,
			password: formData.password,
			firstName: formData.firstName,
			lastName: formData.lastName,
			providerTypeId: formData.providerTypeId,
			documentType: formData.documentType,
			documentNumber: formData.documentNumber,
		};

		if (
			this.selectedProviderTypeRequiresLicense &&
			formData.professionalLicenseNumber
		) {
			data.professionalLicenseNumber = formData.professionalLicenseNumber;
		}
		if (formData.middleName) data.middleName = formData.middleName;
		if (formData.secondLastName) data.secondLastName = formData.secondLastName;
		if (formData.phone) data.phone = formData.phone;
		if (formData.gender) data.gender = formData.gender;
		if (formData.neighborhood) data.neighborhood = formData.neighborhood;
		if (formData.address) data.address = formData.address;
		if (formData.commune) data.commune = formData.commune;

		if (scheduleData) {
			data.schedule = scheduleData;
			data.clinicBranchId = scheduleData.clinicBranchId;
		}

		return data;
	}

	isScheduleReady(): boolean {
		return !!this.scheduleFormComponent?.getScheduleData();
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
