import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { OrganizationService } from '@app/core/services/organization.service';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-upgrade-organization',
	standalone: true,
	imports: [FormsModule],
	templateUrl: './upgrade-organization.component.html',
	styleUrl: './upgrade-organization.component.scss',
})
export class UpgradeOrganizationComponent {
	private readonly location = inject(Location);
	private readonly router = inject(Router);
	private readonly organizationService = inject(OrganizationService);

	cardHolder = '';
	cardNumber = '';
	expiration = '';
	cvc = '';

	processing = false;
	errorMessage: string | null = null;

	goBack(): void {
		this.location.back();
	}

	onCardNumberInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, '');
		if (value.length > 16) {
			value = value.substring(0, 16);
		}
		const matches = value.match(/\d{1,4}/g);
		this.cardNumber = matches ? matches.join(' ') : value;
		input.value = this.cardNumber;
	}

	onExpirationInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, '');
		if (value.length >= 2) {
			const month = parseInt(value.substring(0, 2), 10);
			if (month > 12) {
				value = '12' + value.substring(2);
			} else if (month === 0 && value.length === 2) {
				value = '01';
			}
		}
		if (value.length > 4) {
			value = value.substring(0, 4);
		}
		if (value.length > 2) {
			this.expiration = value.substring(0, 2) + '/' + value.substring(2);
		} else {
			this.expiration = value;
		}
		input.value = this.expiration;
	}

	onCvcInput(event: Event): void {
		const input = event.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, '');
		if (value.length > 3) {
			value = value.substring(0, 3);
		}
		this.cvc = value;
		input.value = this.cvc;
	}

	get isCardNumberValid(): boolean {
		if (!this.cardNumber) return true;
		return this.cardNumber.replace(/\s/g, '').length === 16;
	}

	get isExpirationValid(): boolean {
		if (!this.expiration) return true;
		const expRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
		if (!expRegex.test(this.expiration)) return false;

		const [monthStr, yearStr] = this.expiration.split('/');
		const month = parseInt(monthStr, 10);
		const year = 2000 + parseInt(yearStr, 10);

		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth() + 1;

		return year > currentYear || (year === currentYear && month >= currentMonth);
	}

	get isCvcValid(): boolean {
		if (!this.cvc) return true;
		return this.cvc.length === 3;
	}

	isFormValid(): boolean {
		if (!this.cardHolder || !this.cardNumber || !this.expiration || !this.cvc) {
			return false;
		}
		const cleanCardNumber = this.cardNumber.replace(/\s/g, '');
		const expRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
		if (cleanCardNumber.length !== 16 || !expRegex.test(this.expiration) || this.cvc.length !== 3) {
			return false;
		}
		const [monthStr, yearStr] = this.expiration.split('/');
		const month = parseInt(monthStr, 10);
		const year = 2000 + parseInt(yearStr, 10);

		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth() + 1;

		return year > currentYear || (year === currentYear && month >= currentMonth);
	}

	onSubmit(): void {
		if (!this.cardHolder || !this.cardNumber || !this.expiration || !this.cvc) {
			this.errorMessage = 'Por favor, complete todos los campos de pago.';
			return;
		}

		const cleanCardNumber = this.cardNumber.replace(/\s/g, '');
		if (cleanCardNumber.length !== 16) {
			this.errorMessage = 'El número de tarjeta debe tener 16 dígitos.';
			return;
		}

		const expRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
		if (!expRegex.test(this.expiration)) {
			this.errorMessage = 'La fecha de expiración debe tener el formato MM/AA (ej. 12/28).';
			return;
		}

		// Validar que la fecha sea futura o igual al mes actual
		const [monthStr, yearStr] = this.expiration.split('/');
		const month = parseInt(monthStr, 10);
		const year = 2000 + parseInt(yearStr, 10);

		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth() + 1;

		if (year < currentYear || (year === currentYear && month < currentMonth)) {
			this.errorMessage = 'La fecha de expiración no puede estar en el pasado.';
			return;
		}

		if (this.cvc.length !== 3) {
			this.errorMessage = 'El código CVC debe tener exactamente 3 dígitos.';
			return;
		}

		this.processing = true;
		this.errorMessage = null;

		// Simulamos un procesamiento de pago de 1.5s
		setTimeout(() => {
			this.organizationService.requestUpgrade().subscribe({
				next: (response) => {
					this.processing = false;
					alert('¡Upgrade realizado con éxito! Bienvenido a Super Aliado KM.');
					
					// Notificar cambio al dashboard para refrescar el menú lateral
					this.organizationService.refresh$.next();
					
					// Redirigir al panel
					this.router.navigate(['/dashboard/organization/home']);
				},
				error: (error) => {
					console.error('Error processing upgrade', error);
					this.errorMessage = 'Hubo un problema al procesar el pago. Intente de nuevo.';
					this.processing = false;
				}
			});
		}, 1500);
	}
}
