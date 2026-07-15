import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { OrganizationService } from '@app/core/services/organization.service';
import { Router } from '@angular/router';
import { environment } from '@env/environment';

@Component({
	selector: 'app-profile-organization',
	standalone: true,
	imports: [ReactiveFormsModule],
	templateUrl: './profile-organization.component.html',
	styleUrl: './profile-organization.component.scss',
})
export class ProfileOrganizationComponent implements OnInit {
	private readonly fb = inject(FormBuilder);
	private readonly organizationService = inject(OrganizationService);
	private readonly router = inject(Router);

	profileForm!: FormGroup;
	loading = true;
	saving = false;
	successMessage: string | null = null;
	errorMessage: string | null = null;
	isSuperAliado = false;
	logoUrl: string | null = null;
	logoPreview: string | null = null;
	selectedLogoFile: File | null = null;

	get organizationName(): string {
		return this.profileForm?.get('trade_name')?.value || this.profileForm?.get('legal_name')?.value || '';
	}

	cities = [
		{ name: 'Bogotá D.C.', department: 'Cundinamarca' },
		{ name: 'Medellín', department: 'Antioquia' },
		{ name: 'Cali', department: 'Valle del Cauca' },
		{ name: 'Barranquilla', department: 'Atlántico' }
	];

	ngOnInit(): void {
		this.initForm();
		this.loadProfile();

		// Escuchar cambios de ciudad para autocompletar departamento
		this.profileForm.get('city')?.valueChanges.subscribe((cityName) => {
			const cityMatch = this.cities.find((c) => c.name === cityName);
			if (cityMatch) {
				this.profileForm.patchValue({ department: cityMatch.department });
			}
		});
	}

	initForm(): void {
		this.profileForm = this.fb.group({
			legal_name: ['', [Validators.required, Validators.maxLength(255)]],
			trade_name: ['', [Validators.maxLength(255)]],
			document_number: ['', [Validators.required, Validators.maxLength(50)]],
			website_url: ['', [Validators.maxLength(255)]],
			email: ['', [Validators.email, Validators.maxLength(150)]],
			phone: ['', [Validators.maxLength(50)]],
			city: ['', [Validators.maxLength(100)]],
			department: [{ value: '', disabled: true }, [Validators.maxLength(100)]],
			address: ['', [Validators.maxLength(255)]],
			description: ['', [Validators.maxLength(1000)]],
			contact_person_name: ['', [Validators.maxLength(255)]],
		});
	}

	loadProfile(): void {
		this.loading = true;
		this.organizationService.getProfile().subscribe({
			next: (data) => {
				this.isSuperAliado = data.isSuperAliado;
				this.logoUrl = data.logo_url;
				this.profileForm.patchValue({
					legal_name: data.legal_name,
					trade_name: data.trade_name || '',
					document_number: data.document_number,
					website_url: data.website_url || '',
					email: data.email,
					phone: data.phone || '',
					city: data.city || 'Bogotá D.C.',
					department: data.department || 'Cundinamarca',
					address: data.address || '',
					description: data.description || '',
					contact_person_name: data.contact_person_name || '',
				});
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading organization profile', error);
				this.errorMessage = 'No fue posible cargar el perfil. Intente de nuevo.';
				this.loading = false;
			}
		});
	}

	onSubmit(): void {
		if (this.profileForm.invalid) {
			this.errorMessage = 'Por favor, complete todos los campos obligatorios.';
			return;
		}

		this.saving = true;
		this.successMessage = null;
		this.errorMessage = null;

		// El departamento está deshabilitado en el form para que no sea editable,
		// por lo que usamos getRawValue() para obtener todos los valores.
		const data = this.profileForm.getRawValue();

		if (this.selectedLogoFile) {
			this.organizationService.uploadLogo(this.selectedLogoFile).subscribe({
				next: (res) => {
					this.logoUrl = res.logo_url;
					this.selectedLogoFile = null;
					this.logoPreview = null;
					// Update profile rest of info, sending the new logo_url too
					data.logo_url = res.logo_url;
					this.updateProfile(data);
				},
				error: (error) => {
					console.error('Error uploading logo', error);
					this.errorMessage = 'Error al subir la imagen del logo.';
					this.saving = false;
				}
			});
		} else {
			this.updateProfile(data);
		}
	}

	updateProfile(data: any): void {
		this.organizationService.updateProfile(data).subscribe({
			next: (response) => {
				this.successMessage = 'Perfil corporativo actualizado exitosamente.';
				this.saving = false;
				if (response.data?.logo_url) {
					this.logoUrl = response.data.logo_url;
				}
				setTimeout(() => {
					this.successMessage = null;
				}, 4000);
			},
			error: (error) => {
				console.error('Error updating profile', error);
				this.errorMessage = 'Error al actualizar el perfil corporativo. Verifique los datos.';
				this.saving = false;
			}
		});
	}

	onLogoSelected(event: Event): void {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			const file = target.files[0];
			this.selectedLogoFile = file;

			// Generate local preview
			const reader = new FileReader();
			reader.onload = () => {
				this.logoPreview = reader.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	getFullLogoUrl(path: string | null): string {
		if (!path) return '';
		if (path.startsWith('http')) return path;
		const serverUrl = environment.apiUrl.replace('/api/', '');
		return `${serverUrl}${path}`;
	}

	goToUpgrade(): void {
		this.router.navigate(['/dashboard/organization/upgrade']);
	}
}
