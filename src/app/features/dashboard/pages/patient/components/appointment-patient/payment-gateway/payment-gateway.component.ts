import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-payment-gateway',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './payment-gateway.component.html',
	styleUrl: './payment-gateway.component.scss',
})
export class PaymentGatewayComponent implements OnInit {
	private readonly route = inject(ActivatedRoute);

	serviceName = 'Consulta de Medicina General';
	providerName = 'Dr. Alejandro Silva';
	scheduledDateLabel = 'Viernes, 24 de Noviembre - 10:30 AM';
	readonly totalAmount = '$55.000';

	ngOnInit(): void {
		const queryMap = this.route.snapshot.queryParamMap;

		const serviceName = queryMap.get('serviceName');
		const providerName = queryMap.get('providerName');
		const date = queryMap.get('date');
		const startTime = queryMap.get('startTime');

		if (serviceName && serviceName.trim().length > 0) {
			this.serviceName = serviceName;
		}

		if (providerName && providerName.trim().length > 0) {
			this.providerName = providerName;
		}

		this.scheduledDateLabel = this.buildScheduledDateLabel(date, startTime);
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
