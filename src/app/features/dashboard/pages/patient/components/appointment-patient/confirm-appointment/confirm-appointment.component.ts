import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentBookingStateService } from '@app/core/services/appointment-booking-state.service';
import { AppointmentService } from '@app/core/services/appointment.service';

@Component({
	selector: 'app-confirm-appointment',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './confirm-appointment.component.html',
	styleUrl: './confirm-appointment.component.scss',
})
export class ConfirmAppointmentComponent implements OnInit {
	private readonly appointmentService = inject(AppointmentService);
	private readonly appointmentBookingState = inject(
		AppointmentBookingStateService,
	);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);

	specialty: string | null = null;
	serviceId: string | null = null;
	serviceCode: string | null = null;
	serviceName: string | null = null;
	providerId: string | null = null;
	providerName: string | null = null;
	slotId: string | null = null;
	selectedDate = '';
	selectedStartTime = '';
	selectedEndTime = '';

	isSubmitting = false;
	errorMessage: string | null = null;

	ngOnInit(): void {
		const snapshot = this.appointmentBookingState.getSnapshot();
		const queryMap = this.route.snapshot.queryParamMap;

		this.specialty = queryMap.get('specialty') ?? snapshot.specialty;
		this.serviceId = queryMap.get('serviceId') ?? snapshot.serviceId;
		this.serviceCode = queryMap.get('serviceCode') ?? snapshot.serviceCode;
		this.serviceName = queryMap.get('serviceName') ?? snapshot.serviceName;
		this.providerId = queryMap.get('providerId') ?? snapshot.providerId;
		this.providerName = queryMap.get('providerName') ?? snapshot.providerName;
		this.slotId = queryMap.get('slotId') ?? snapshot.slotId;
		this.selectedDate = queryMap.get('date') ?? snapshot.slotDate ?? '';
		this.selectedStartTime =
			queryMap.get('startTime') ?? snapshot.slotStartTime ?? '';
		this.selectedEndTime =
			queryMap.get('endTime') ?? snapshot.slotEndTime ?? '';

		if (!this.canConfirm) {
			this.navigateToDatetime();
			return;
		}

		this.appointmentBookingState.setSlotSelection({
			slotId: this.slotId,
			slotDate: this.selectedDate,
			slotStartTime: this.selectedStartTime,
			slotEndTime: this.selectedEndTime,
		});
	}

	get canConfirm(): boolean {
		return (
			!!this.slotId &&
			!!this.providerId &&
			!!this.serviceId &&
			!!this.selectedDate &&
			!!this.selectedStartTime
		);
	}

	get selectedDateLabel(): string {
		if (!this.selectedDate) {
			return '--';
		}

		const parsedDate = new Date(`${this.selectedDate}T00:00:00`);
		if (Number.isNaN(parsedDate.getTime())) {
			return this.selectedDate;
		}

		const formatted = parsedDate.toLocaleDateString('es-CO', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
		});

		return formatted.charAt(0).toUpperCase() + formatted.slice(1);
	}

	get specialtyLabel(): string {
		if (!this.specialty) {
			return 'No seleccionada';
		}

		return this.specialty
			.split('-')
			.map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
			.join(' ');
	}

	get displayStartTime(): string {
		return this.getDisplayTime(this.selectedStartTime);
	}

	get displayEndTime(): string {
		return this.getDisplayTime(this.selectedEndTime);
	}

	goBack(): void {
		this.navigateToDatetime();
	}

	confirmAppointment(): void {
		if (!this.canConfirm || this.isSubmitting) {
			return;
		}

		this.isSubmitting = true;
		this.errorMessage = null;

		this.appointmentService
			.createAppointment({
				slotId: this.slotId!,
				providerId: this.providerId!,
				serviceId: this.serviceId!,
			})
			.subscribe({
				next: () => {
					this.isSubmitting = false;
					this.appointmentBookingState.clear();
					this.router.navigate(['/dashboard/patient/appointments'], {
						queryParams: {
							created: '1',
							specialty: this.specialty ?? undefined,
							serviceId: this.serviceId ?? undefined,
							serviceCode: this.serviceCode ?? undefined,
							serviceName: this.serviceName ?? undefined,
							providerId: this.providerId ?? undefined,
							providerName: this.providerName ?? undefined,
							date: this.selectedDate,
							startTime: this.selectedStartTime,
						},
					});
				},
				error: (error) => {
					this.isSubmitting = false;
					this.errorMessage = this.getErrorMessage(
						error,
						'No fue posible crear la cita. Inténtalo nuevamente.',
					);
				},
			});
	}

	private navigateToDatetime(): void {
		this.router.navigate(
			['/dashboard/patient/appointments/schedule/select-datetime'],
			{
				queryParams: {
					specialty: this.specialty ?? undefined,
					serviceId: this.serviceId ?? undefined,
					serviceCode: this.serviceCode ?? undefined,
					serviceName: this.serviceName ?? undefined,
					providerId: this.providerId ?? undefined,
					providerName: this.providerName ?? undefined,
					date: this.selectedDate || undefined,
					slotId: this.slotId ?? undefined,
				},
			},
		);
	}

	private getDisplayTime(dateTime: string): string {
		if (!dateTime) {
			return '--:--';
		}

		if (/^\d{2}:\d{2}/.test(dateTime)) {
			return dateTime.slice(0, 5);
		}

		const parsedDate = new Date(dateTime);
		if (!Number.isNaN(parsedDate.getTime())) {
			return parsedDate.toLocaleTimeString('es-CO', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			});
		}

		return '--:--';
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
}
