import { Component } from '@angular/core';
import { InputEmailComponent } from '../../../../shared/components/form/input-email/input-email.component';
import { InputPasswordComponent } from '../../../../shared/components/form/input-password/input-password.component';
import { InputTextComponent } from '../../../../shared/components/form/input-text/input-text.component';
import { SelectComponent } from '../../../../shared/components/form/select/select.component';
import {
	FormBuilder,
	FormGroup,
	Validators,
	AbstractControl,
	ValidatorFn,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
	COLOMBIA_DOCUMENT_TYPES,
	DEFAULT_LOCATION_CATALOG,
	NeighborhoodOption,
} from '../../data/colombia-location-catalog';

@Component({
	selector: 'app-register-patient',
	standalone: true,
	imports: [
		InputEmailComponent,
		InputPasswordComponent,
		InputTextComponent,
		SelectComponent,
		ReactiveFormsModule,
		RouterModule,
	],
	templateUrl: './register-patient.component.html',
	styleUrl: './register-patient.component.scss',
})
export class RegisterPatientComponent {
	public readonly documentTypeOptions = [...COLOMBIA_DOCUMENT_TYPES];

	private readonly locationCatalog: Record<
		string,
		Record<string, NeighborhoodOption[]>
	> = DEFAULT_LOCATION_CATALOG;

	public form: FormGroup;
	public isSubmitting = false;

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router,
	) {
		this.form = this.buildForm();
		this.setupLocationDependencies();
	}

	private buildForm(): FormGroup {
		return this.fb.group(
			{
				email: ['', [Validators.required, Validators.email]],
				password: ['', [Validators.required, Validators.minLength(8)]],
				confirmPassword: ['', [Validators.required]],
				firstName: ['', [Validators.required]],
				middleName: [''],
				lastName: ['', [Validators.required]],
				secondLastName: [''],
				documentType: ['CC'],
				documentNumber: [null],
				phone: [''],
				address: [''],
				department: [''],
				city: [{ value: '', disabled: true }],
				neighborhood: [{ value: '', disabled: true }],
				commune: [{ value: null, disabled: true }],
				terms: [false, [Validators.requiredTrue]],
			},
			{ validators: this.passwordsMatchValidator },
		);
	}

	get departmentOptions() {
		return Object.keys(this.locationCatalog).map((department) => ({
			value: department,
			label: department,
		}));
	}

	get cityOptions() {
		const department = this.form.get('department')?.value as string;
		if (!department || !this.locationCatalog[department]) {
			return [];
		}

		return Object.keys(this.locationCatalog[department]).map((city) => ({
			value: city,
			label: city,
		}));
	}

	get neighborhoodOptions() {
		const department = this.form.get('department')?.value as string;
		const city = this.form.get('city')?.value as string;

		return this.locationCatalog[department]?.[city] ?? [];
	}

	get communeOptions() {
		const commune = this.form.get('commune')?.value as number | null;
		if (!commune) {
			return [];
		}

		return [{ value: commune, label: `Comuna ${commune}` }];
	}

	private setupLocationDependencies() {
		const departmentControl = this.form.get('department');
		const cityControl = this.form.get('city');
		const neighborhoodControl = this.form.get('neighborhood');
		const communeControl = this.form.get('commune');

		departmentControl?.valueChanges.subscribe((department: string) => {
			cityControl?.reset('');
			neighborhoodControl?.reset('');
			communeControl?.reset(null);

			if (department) {
				cityControl?.enable();
			} else {
				cityControl?.disable();
				neighborhoodControl?.disable();
			}
		});

		cityControl?.valueChanges.subscribe((city: string) => {
			neighborhoodControl?.reset('');
			communeControl?.reset(null);

			if (city && this.neighborhoodOptions.length > 0) {
				neighborhoodControl?.enable();
			} else {
				neighborhoodControl?.disable();
			}
		});

		neighborhoodControl?.valueChanges.subscribe((neighborhood: string) => {
			const selectedNeighborhood = this.neighborhoodOptions.find(
				(option) => option.value === neighborhood,
			);

			communeControl?.setValue(selectedNeighborhood?.commune ?? null);
		});
	}

	private asOptionalString(value: unknown): string | undefined {
		if (value === null || value === undefined) return undefined;
		const normalized = String(value).trim();
		return normalized ? normalized : undefined;
	}

	private passwordsMatchValidator: ValidatorFn = (control: AbstractControl) => {
		const pwd = control.get('password')?.value;
		const confirm = control.get('confirmPassword')?.value;
		return pwd === confirm ? null : { passwordsMismatch: true };
	};

	get f() {
		return this.form.controls;
	}

	onSubmit() {
		if (this.form.invalid) {
			this.form.markAllAsTouched();
			return;
		}

		const { confirmPassword, terms, ...formValue } = this.form.getRawValue();

		const payload = {
			email: formValue.email,
			password: formValue.password,
			firstName: formValue.firstName,
			lastName: formValue.lastName,
			middleName: this.asOptionalString(formValue.middleName),
			secondLastName: this.asOptionalString(formValue.secondLastName),
			documentType: this.asOptionalString(formValue.documentNumber)
				? formValue.documentType
				: undefined,
			documentNumber: this.asOptionalString(formValue.documentNumber),
			phone: this.asOptionalString(formValue.phone),
			address: this.asOptionalString(formValue.address),
			department: this.asOptionalString(formValue.department),
			city: this.asOptionalString(formValue.city),
			neighborhood: this.asOptionalString(formValue.neighborhood),
			commune: formValue.commune ? Number(formValue.commune) : undefined,
		};

		this.isSubmitting = true;

		this.authService.registerPatient(payload).subscribe({
			next: () => {
				this.isSubmitting = false;
				this.router.navigate(['/login/patient']);
			},
			error: () => {
				this.isSubmitting = false;
			},
		});
	}
}
