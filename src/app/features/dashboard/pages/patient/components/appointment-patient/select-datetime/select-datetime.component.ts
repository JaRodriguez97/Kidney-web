import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
	AppointmentService,
	GetBookedTimesResponse,
} from '@app/core/services/appointment.service';
import { AppointmentBookingStateService } from '@app/core/services/appointment-booking-state.service';

interface VirtualSlot {
	id: string;
	startTime: string;
	endTime: string;
}

const VIRTUAL_SLOTS: VirtualSlot[] = Array.from({ length: 18 }, (_, index) => {
	const startMinutes = 8 * 60 + index * 30;
	const endMinutes = startMinutes + 30;
	const startHour = String(Math.floor(startMinutes / 60)).padStart(2, '0');
	const startMinute = String(startMinutes % 60).padStart(2, '0');
	const endHour = String(Math.floor(endMinutes / 60)).padStart(2, '0');
	const endMinute = String(endMinutes % 60).padStart(2, '0');

	return {
		id: `slot-${startHour}${startMinute}`,
		startTime: `${startHour}:${startMinute}`,
		endTime: `${endHour}:${endMinute}`,
	};
});

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
	availableSlots: VirtualSlot[] = [];
	bookedTimes: string[] = [];
	isLoadingSlots = false;
	slotsError: string | null = null;
	isSavingAppointment = false;

	calendarOptions!: CalendarOptions;

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
		return !!this.selectedSlotId && !this.isSavingAppointment;
	}

	get minDate(): string {
		return this.getTodayDate();
	}

	get hasDateSelected(): boolean {
		return !!this.selectedDate;
	}

	get morningSlots(): VirtualSlot[] {
		return this.availableSlots.filter(
			(slot) => this.getHour(slot.startTime) < 12,
		);
	}

	get afternoonSlots(): VirtualSlot[] {
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
		this.selectedDate = date;
		this.selectedSlotId = null;

		if (!date) {
			this.availableSlots = [];
			this.bookedTimes = [];
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

	selectSlot(slot: VirtualSlot): void {
		if (this.bookedTimes.includes(slot.startTime)) {
			return;
		}

		this.selectedSlotId = slot.id;
		this.appointmentBookingState.setSlotSelection({
			slotId: null,
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

		this.isSavingAppointment = true;
		this.slotsError = null;

		this.appointmentBookingState.setSlotSelection({
			slotId: null,
			slotDate: this.selectedDate,
			slotStartTime: selectedSlot.startTime,
			slotEndTime: selectedSlot.endTime,
		});

		this.appointmentService
			.createAppointment({
				providerId: this.providerId,
				serviceId: this.serviceId,
				date: this.selectedDate,
				startTime: selectedSlot.startTime,
				endTime: selectedSlot.endTime,
			})
			.subscribe({
				next: () => {
					this.isSavingAppointment = false;
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
							startTime: selectedSlot.startTime,
						},
					});
				},
				error: () => {
					this.isSavingAppointment = false;
					this.slotsError =
						'No fue posible crear la cita. Verifica la disponibilidad e inténtalo de nuevo.';
					this.loadSlots();
				},
			});
	}

	isSelectedSlot(slot: VirtualSlot): boolean {
		return this.selectedSlotId === slot.id;
	}

	trackBySlotId(_: number, slot: VirtualSlot): string {
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
		if (!this.providerId || !this.selectedDate) {
			this.availableSlots = [];
			this.bookedTimes = [];
			this.selectedSlotId = null;
			return;
		}

		this.isLoadingSlots = true;
		this.slotsError = null;

		this.appointmentService
			.getBookedTimes(this.providerId, this.selectedDate)
			.subscribe({
				next: (response: GetBookedTimesResponse) => {
					this.bookedTimes = response.bookedTimes;
					this.availableSlots = VIRTUAL_SLOTS.filter(
						(slot) => !this.bookedTimes.includes(slot.startTime),
					);

					if (
						this.selectedSlotId &&
						!this.availableSlots.some((slot) => slot.id === this.selectedSlotId)
					) {
						this.selectedSlotId = null;
					}

					this.isLoadingSlots = false;
				},
				error: () => {
					this.availableSlots = [];
					this.bookedTimes = [];
					this.selectedSlotId = null;
					this.slotsError =
						'No fue posible cargar los horarios disponibles para la fecha seleccionada.';
					this.isLoadingSlots = false;
				},
			});
	}

	private initializeCalendar(): void {
		this.calendarOptions = {
			plugins: [dayGridPlugin, interactionPlugin],
			locale: esLocale,
			initialView: 'dayGridMonth',
			initialDate: this.selectedDate || this.getTodayDate(),
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

	private getTodayDate(): string {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');

		return `${year}-${month}-${day}`;
	}
}
