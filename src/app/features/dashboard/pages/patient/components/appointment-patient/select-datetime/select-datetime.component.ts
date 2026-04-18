import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
	AvailableSlot,
	AppointmentService,
} from '@app/core/services/appointment.service';
import { AppointmentBookingStateService } from '@app/core/services/appointment-booking-state.service';

@Component({
	selector: 'app-select-datetime',
	standalone: true,
	imports: [CommonModule, FormsModule, FullCalendarModule],
	templateUrl: './select-datetime.component.html',
	styleUrl: './select-datetime.component.scss',
})
export class SelectDatetimeComponent implements OnInit {
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

	selectedDate = '';
	selectedSlotId: string | null = null;
	availableSlots: AvailableSlot[] = [];
	isLoadingSlots = false;
	slotsError: string | null = null;

	calendarOptions!: CalendarOptions;

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

	ngOnInit(): void {
		const snapshot = this.appointmentBookingState.getSnapshot();
		const queryMap = this.route.snapshot.queryParamMap;

		this.specialty = queryMap.get('specialty') ?? snapshot.specialty;
		this.serviceId = queryMap.get('serviceId') ?? snapshot.serviceId;
		this.serviceCode = queryMap.get('serviceCode') ?? snapshot.serviceCode;
		this.serviceName = queryMap.get('serviceName') ?? snapshot.serviceName;
		this.providerId = queryMap.get('providerId') ?? snapshot.providerId;
		this.providerName = queryMap.get('providerName') ?? snapshot.providerName;

		this.selectedDate = queryMap.get('date') ?? snapshot.slotDate ?? '';
		this.selectedSlotId = queryMap.get('slotId') ?? snapshot.slotId;

		if (this.selectedDate && this.selectedDate < this.minDate) {
			this.selectedDate = '';
			this.selectedSlotId = null;
		}

		this.initializeCalendar();

		if (!this.specialty || !this.serviceId || !this.providerId) {
			this.router.navigate(['/dashboard/patient/appointments/schedule']);
			return;
		}

		if (this.selectedDate) {
			this.loadSlots();
		}
	}

	get canContinue(): boolean {
		return !!this.selectedSlotId;
	}

	get minDate(): string {
		return this.getMinimumBookableDate();
	}

	get hasDateSelected(): boolean {
		return !!this.selectedDate;
	}

	get morningSlots(): AvailableSlot[] {
		return this.availableSlots.filter(
			(slot) => this.getHour(slot.startTime) < 12,
		);
	}

	get afternoonSlots(): AvailableSlot[] {
		return this.availableSlots.filter(
			(slot) => this.getHour(slot.startTime) >= 12,
		);
	}

	get selectedDateLabel(): string {
		if (!this.selectedDate) {
			return 'Selecciona un día en el calendario';
		}

		const parsedDate = new Date(`${this.selectedDate}T00:00:00`);
		const formatted = parsedDate.toLocaleDateString('es-CO', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
		});

		return formatted.charAt(0).toUpperCase() + formatted.slice(1);
	}

	onDateChange(date: string): void {
		if (date && date < this.minDate) {
			this.selectedDate = '';
			this.selectedSlotId = null;
			this.availableSlots = [];
			this.slotsError = 'Solo puedes agendar desde pasado mañana en adelante.';
			return;
		}

		this.selectedDate = date;
		this.selectedSlotId = null;

		if (!date) {
			this.availableSlots = [];
			this.slotsError = null;
			return;
		}

		this.loadSlots();
	}

	onCalendarDateClick(arg: DateClickArg): void {
		if (arg.dateStr < this.minDate) {
			return;
		}

		this.onDateChange(arg.dateStr);
		this.initializeCalendar();
	}

	selectSlot(slot: AvailableSlot): void {
		this.selectedSlotId = slot.id;
		this.appointmentBookingState.setSlotSelection({
			slotId: slot.id,
			slotDate: this.selectedDate,
			slotStartTime: slot.startTime,
			slotEndTime: slot.endTime,
		});
	}

	goBack(): void {
		this.router.navigate(
			['/dashboard/patient/appointments/schedule/select-provider'],
			{
				queryParams: {
					specialty: this.specialty ?? undefined,
					serviceId: this.serviceId ?? undefined,
					serviceCode: this.serviceCode ?? undefined,
					serviceName: this.serviceName ?? undefined,
					providerId: this.providerId ?? undefined,
				},
			},
		);
	}

	goToNextStep(): void {
		if (
			!this.selectedSlotId ||
			!this.selectedDate ||
			!this.providerId ||
			!this.serviceId
		) {
			return;
		}

		const selectedSlot = this.availableSlots.find(
			(slot) => slot.id === this.selectedSlotId,
		);

		if (!selectedSlot) {
			return;
		}

		this.appointmentBookingState.setSlotSelection({
			slotId: selectedSlot.id,
			slotDate: this.selectedDate,
			slotStartTime: selectedSlot.startTime,
			slotEndTime: selectedSlot.endTime,
		});

		this.router.navigate(
			['/dashboard/patient/appointments/schedule/confirm-appointment'],
			{
				queryParams: {
					specialty: this.specialty ?? undefined,
					serviceId: this.serviceId ?? undefined,
					serviceCode: this.serviceCode ?? undefined,
					serviceName: this.serviceName ?? undefined,
					providerId: this.providerId,
					providerName: this.providerName ?? undefined,
					slotId: selectedSlot.id,
					date: this.selectedDate,
					startTime: selectedSlot.startTime,
					endTime: selectedSlot.endTime,
				},
			},
		);
	}

	isSelectedSlot(slot: AvailableSlot): boolean {
		return this.selectedSlotId === slot.id;
	}

	trackBySlotId(_: number, slot: AvailableSlot): string {
		return slot.id;
	}

	getDisplayTime(dateTime: string): string {
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

	private loadSlots(): void {
		if (!this.providerId || !this.serviceId || !this.selectedDate) {
			this.availableSlots = [];
			this.selectedSlotId = null;
			return;
		}

		this.isLoadingSlots = true;
		this.slotsError = null;

		this.appointmentService
			.getAvailableSlots(this.providerId, this.serviceId, this.selectedDate)
			.subscribe({
				next: (slots) => {
					this.availableSlots = slots.filter(
						(slot) => slot.available > 0 && slot.status === 'AVAILABLE',
					);

					if (
						this.selectedSlotId &&
						!this.availableSlots.some((slot) => slot.id === this.selectedSlotId)
					) {
						this.selectedSlotId = null;
					}

					this.isLoadingSlots = false;
				},
				error: (error) => {
					this.availableSlots = [];
					this.selectedSlotId = null;
					this.slotsError = this.getErrorMessage(
						error,
						'No fue posible cargar los horarios disponibles para la fecha seleccionada.',
					);
					this.isLoadingSlots = false;
				},
			});
	}

	private initializeCalendar(): void {
		this.calendarOptions = {
			plugins: [dayGridPlugin, interactionPlugin],
			locale: esLocale,
			initialView: 'dayGridMonth',
			initialDate:
				this.selectedDate && this.selectedDate >= this.minDate
					? this.selectedDate
					: this.minDate,
			headerToolbar: {
				left: 'prev',
				center: 'title',
				right: 'next',
			},
			height: 'auto',
			fixedWeekCount: false,
			showNonCurrentDates: true,
			selectable: false,
			eventDisplay: 'none',
			dateClick: (arg) => this.onCalendarDateClick(arg),
			dayCellClassNames: (arg) => {
				const classes: string[] = [];
				const day = arg.date.toISOString().slice(0, 10);

				if (day < this.minDate) {
					classes.push('fc-day-disabled-custom');
				} else {
					classes.push('fc-day-available-custom');
				}

				if (day === this.selectedDate) {
					classes.push('fc-day-selected-custom');
				}

				return classes;
			},
			dayHeaderContent: (arg) =>
				arg.text.replace('.', '').slice(0, 2).toUpperCase(),
		};
	}

	private getHour(dateTime: string): number {
		if (/^\d{2}:\d{2}/.test(dateTime)) {
			return Number(dateTime.slice(0, 2));
		}

		const parsed = new Date(dateTime);
		if (!Number.isNaN(parsed.getTime())) {
			return parsed.getHours();
		}

		return 0;
	}

	private getMinimumBookableDate(): string {
		const now = new Date();
		const minimumDateUtc = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
		);
		minimumDateUtc.setUTCDate(minimumDateUtc.getUTCDate() + 2);

		const year = minimumDateUtc.getUTCFullYear();
		const month = String(minimumDateUtc.getUTCMonth() + 1).padStart(2, '0');
		const day = String(minimumDateUtc.getUTCDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}
}
