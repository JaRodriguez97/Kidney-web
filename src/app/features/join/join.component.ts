import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OrganizationService } from '@app/core/services/organization.service';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-join',
	standalone: true,
	imports: [FormsModule, RouterLink],
	templateUrl: './join.component.html',
	styleUrl: './join.component.scss',
})
export class JoinComponent {
	private readonly organizationService = inject(OrganizationService);
	private readonly router = inject(Router);

	legalName = '';
	documentNumber = '';
	entityType = '';
	contactPersonName = '';
	contactEmail = '';
	contactPhone = '+57 ';
	password = '';
	city = '';
	message = '';

	loading = false;
	successMessage: string | null = null;
	errorMessage: string | null = null;

	onPhoneInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		let val = input.value;
		if (!val.startsWith('+57')) {
			// Si intentan borrar el +57, lo volvemos a poner
			val = '+57 ' + val.replace(/^\+57\s*/, '');
		}
		this.contactPhone = val;
		input.value = this.contactPhone;
	}

	onSubmit(): void {
		if (
			!this.legalName ||
			!this.documentNumber ||
			!this.entityType ||
			!this.contactPersonName ||
			!this.contactEmail ||
			!this.password ||
			!this.city
		) {
			this.errorMessage = 'Por favor, complete todos los campos obligatorios.';
			return;
		}

		if (this.password.length < 8) {
			this.errorMessage = 'La contraseña debe tener al menos 8 caracteres.';
			return;
		}

		this.loading = true;
		this.errorMessage = null;
		this.successMessage = null;

		const data = {
			legal_name: this.legalName,
			document_number: this.documentNumber,
			entity_type: this.entityType,
			contact_person_name: this.contactPersonName,
			contact_email: this.contactEmail,
			contact_phone: this.contactPhone.trim(),
			password: this.password,
			city: this.city,
			message: this.message || undefined,
		};

		this.organizationService.createAccessRequest(data).subscribe({
			next: (response) => {
				this.loading = false;
				this.successMessage = '¡Solicitud enviada con éxito! Nos pondremos en contacto pronto.';
				// Limpiar formulario
				this.legalName = '';
				this.documentNumber = '';
				this.entityType = '';
				this.contactPersonName = '';
				this.contactEmail = '';
				this.contactPhone = '+57 ';
				this.password = '';
				this.city = '';
				this.message = '';
			},
			error: (error) => {
				console.error('Error submitting access request', error);
				this.errorMessage = 'Hubo un error al enviar la solicitud. Por favor, intente de nuevo.';
				this.loading = false;
			},
		});
	}
}
