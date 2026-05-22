import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingService } from '@app/core/services/billing.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-payment-gateway',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './payment-gateway.component.html',
	styleUrl: './payment-gateway.component.scss',
})
export class PaymentGatewayComponent implements OnInit {
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly billingService = inject(BillingService);

	serviceName = 'Consulta de Medicina General';
	providerName = 'Dr. Alejandro Silva';
	scheduledDateLabel = 'Viernes, 24 de Noviembre - 10:30 AM';
	totalAmount = '$0';
	invoiceId: string | null = null;
	appointmentId: string | null = null;
	serviceId: string | null = null;
	paymentMethodCode: 'CARD' | 'PSE' = 'CARD';
	isLoadingInvoice = false;
	isSubmitting = false;
	errorMessage: string | null = null;

	ngOnInit(): void {
		const queryMap = this.route.snapshot.queryParamMap;

		const serviceName = queryMap.get('serviceName');
		const providerName = queryMap.get('providerName');
		this.serviceId = queryMap.get('serviceId');
		this.invoiceId = queryMap.get('invoiceId');
		this.appointmentId = queryMap.get('appointmentId');
		const date = queryMap.get('date');
		const startTime = queryMap.get('startTime');

		if (serviceName && serviceName.trim().length > 0) {
			this.serviceName = serviceName;
		}

		if (providerName && providerName.trim().length > 0) {
			this.providerName = providerName;
		}

		this.scheduledDateLabel = this.buildScheduledDateLabel(date, startTime);
		void this.loadOrCreateInvoice();
	}

	onSelectPaymentMethod(method: 'CARD' | 'PSE'): void {
		this.paymentMethodCode = method;
	}

	onSubmitPayment(): void {
		if (!this.invoiceId || this.isSubmitting) {
			return;
		}

		this.isSubmitting = true;
		this.errorMessage = null;

		this.billingService
			.initializePayment(this.invoiceId, {
				paymentMethodCode: this.paymentMethodCode,
			})
			.subscribe({
				next: (response) => {
					this.isSubmitting = false;
					window.location.href = response.paymentUrl;
				},
				error: (error) => {
					this.isSubmitting = false;
					this.errorMessage = this.getErrorMessage(
						error,
						'No fue posible inicializar el pago.',
					);
				},
			});
	}

	onCancel(): void {
		this.router.navigate(['/dashboard/patient/appointments']);
	}

	private async loadOrCreateInvoice(): Promise<void> {
		if (!this.invoiceId && !this.appointmentId) {
			this.errorMessage = 'No encontramos la cita a facturar.';
			return;
		}

		this.isLoadingInvoice = true;
		this.errorMessage = null;

		if (this.invoiceId) {
			this.billingService.getInvoice(this.invoiceId).subscribe({
				next: (invoice) => {
					this.totalAmount = this.formatMoney(invoice.totalAmount);
					this.serviceName = invoice.serviceName || this.serviceName;
					this.isLoadingInvoice = false;
				},
				error: (error) => {
					this.isLoadingInvoice = false;
					this.errorMessage = this.getErrorMessage(
						error,
						'No fue posible cargar la factura.',
					);
				},
			});
			return;
		}

		this.billingService
			.createInvoice({
				appointmentId: this.appointmentId!,
				serviceId: this.serviceId ?? undefined,
			})
			.subscribe({
				next: (created) => {
					this.invoiceId = created.invoiceId;
					this.totalAmount = this.formatMoney(created.totalAmount);
					this.isLoadingInvoice = false;
				},
				error: (error) => {
					this.isLoadingInvoice = false;
					this.errorMessage = this.getErrorMessage(
						error,
						'No fue posible crear la factura para esta cita.',
					);
				},
			});
	}

	private formatMoney(amount: number): string {
		return new Intl.NumberFormat('es-CO', {
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		}).format(amount);
	}

	private getErrorMessage(error: unknown, fallback: string): string {
		if (error instanceof HttpErrorResponse) {
			const backendMessage = (error.error as { message?: string } | null)
				?.message;
			if (backendMessage && backendMessage.trim().length > 0) {
				return backendMessage;
			}
		}

		return fallback;
	}

	private buildScheduledDateLabel(
		date: string | null,
		startTime: string | null,
	): string {
		if (!date || !startTime) {
			return this.scheduledDateLabel;
		}

		const parsedDate = new Date(`${date}T00:00:00`);
		if (Number.isNaN(parsedDate.getTime())) {
			return `${date} - ${this.getDisplayTime(startTime)}`;
		}

		const formattedDate = parsedDate.toLocaleDateString('es-CO', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			timeZone: 'America/Bogota',
		});

		const dateLabel =
			formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

		return `${dateLabel} - ${this.getDisplayTime(startTime)}`;
	}

	private getDisplayTime(timeValue: string): string {
		if (/^\d{2}:\d{2}/.test(timeValue)) {
			const [hoursRaw, minutesRaw] = timeValue.slice(0, 5).split(':');
			const hours = Number(hoursRaw);
			const minutes = Number(minutesRaw);
			if (Number.isNaN(hours) || Number.isNaN(minutes)) {
				return timeValue;
			}

			const period = hours >= 12 ? 'PM' : 'AM';
			const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
			const paddedMinutes = String(minutes).padStart(2, '0');
			return `${normalizedHours}:${paddedMinutes} ${period}`;
		}

		const parsed = new Date(timeValue);
		if (Number.isNaN(parsed.getTime())) {
			return timeValue;
		}

		return parsed.toLocaleTimeString('es-CO', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
			timeZone: 'America/Bogota',
		});
	}
}
