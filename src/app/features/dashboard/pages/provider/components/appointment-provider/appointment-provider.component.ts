import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import {
	CalendarOptions,
	DatesSetArg,
	DateSelectArg,
	EventInput,
} from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
	AvailableSlot,
	AppointmentService,
	GetProviderAgendaResponse,
	ProviderAgendaAlert,
	ProviderAgendaItem,
	ProviderAppointmentStatusAction,
} from '@app/core/services/appointment.service';
import {
	formatColombiaTime,
	toColombiaDateKey,
	toColombiaMonthKey,
} from '@app/shared/utils/colombia-date.utils';
import { forkJoin } from 'rxjs';

@Component({
	selector: 'app-appointment-provider',
	standalone: true,
	imports: [CommonModule, FormsModule, FullCalendarModule],
	templateUrl: './appointment-provider.component.html',
	styleUrl: './appointment-provider.component.scss',
})
export class AppointmentProviderComponent implements OnInit {
	private readonly appointmentService = inject(AppointmentService);
	private readonly router = inject(Router);

	loading = false;
	errorMessage = '';
	selectedDate = this.toDateKey(new Date());
	selectedRangeStart: string | null = null;
	selectedRangeEnd: string | null = null;
	visibleMonth = this.toMonthKey(new Date());
	openMenuAppointmentId: string | null = null;
	actionLoadingAppointmentId: string | null = null;
	rescheduleAppointment: ProviderAgendaItem | null = null;
	rescheduleDate = this.selectedDate;
	rescheduleSlots: AvailableSlot[] = [];
	selectedRescheduleSlotId: string | null = null;
	rescheduleLoading = false;
	rescheduleSubmitting = false;
	rescheduleErrorMessage = '';

	agenda: GetProviderAgendaResponse = {
		date: this.selectedDate,
		month: this.visibleMonth,
		scope: 'SELF',
		selectedProviderId: null,
		appointments: [],
		calendarDays: [],
		stats: {
			totalMonthAppointments: 0,
			confirmedCount: 0,
			inProgressCount: 0,
			cancelledCount: 0,
			pendingCount: 0,
		},
		alerts: [],
	};

	calendarOptions: CalendarOptions = {
		plugins: [dayGridPlugin, interactionPlugin],
		initialView: 'dayGridMonth',
		locale: esLocale,
		headerToolbar: {
			left: 'prev',
			center: 'title',
			right: 'next',
		},
		contentHeight: 200,
		fixedWeekCount: false,
		showNonCurrentDates: true,
		editable: false,
		selectable: true,
		events: [],
		select: (arg) => this.onCalendarRangeSelect(arg),
		dateClick: (arg) => this.onCalendarDateClick(arg),
		datesSet: (arg) => this.onCalendarDatesSet(arg),
	};

	ngOnInit(): void {
		this.loadAgenda();
	}

	get appointments(): ProviderAgendaItem[] {
		return this.agenda.appointments;
	}

	get alerts(): ProviderAgendaAlert[] {
		return this.agenda.alerts;
	}

	get hasContent(): boolean {
		return this.agenda.stats.totalMonthAppointments > 0;
	}

	get selectedDateLabel(): string {
		const parsedDate = new Date(`${this.selectedDate}T00:00:00`);
		if (Number.isNaN(parsedDate.getTime())) {
			return this.selectedDate;
		}

		return parsedDate.toLocaleDateString('es-CO', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: 'America/Bogota',
		});
	}

	trackByAppointment(_: number, appointment: ProviderAgendaItem): string {
		return appointment.id;
	}

	formatTime(dateIso: string): string {
		const formatted = formatColombiaTime(dateIso);
		return formatted === '-' ? '--:--' : formatted;
	}

	getMeridiem(dateIso: string): string {
		const parsed = new Date(dateIso);
		if (Number.isNaN(parsed.getTime())) {
			return '';
		}

		const hour = Number(
			new Intl.DateTimeFormat('en-US', {
				hour: '2-digit',
				hour12: false,
				timeZone: 'America/Bogota',
			}).format(parsed),
		);

		return hour >= 12 ? 'PM' : 'AM';
	}

	getAppointmentRowClasses(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'glass-card p-5 flex items-center gap-4 border-l-4 border-l-green-500 shadow-lg shadow-green-500/10 bg-white/90 border border-green-200/50';
			case 'COMPLETED':
				return 'glass-card p-4 flex items-center gap-4 border-l-4 border-l-slate-300 opacity-90';
			case 'CANCELLED':
				return 'glass-card p-4 flex items-center gap-4 border-l-4 border-l-red-300 opacity-80';
			case 'PENDING_PAYMENT':
				return 'glass-card p-4 flex items-center gap-4 border-l-4 border-l-amber-300 ring-1 ring-amber-200 shadow-lg';
			default:
				return 'glass-card p-4 flex items-center gap-4 border-l-4 border-l-blue-400';
		}
	}

	getStatusLabel(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'PENDING_PAYMENT':
				return 'Pendiente';
			case 'CONFIRMED':
				return 'Confirmada';
			case 'CHECKED_IN':
				return 'En Sala';
			case 'IN_PROGRESS':
				return 'En Atencion';
			case 'COMPLETED':
				return 'Finalizada';
			case 'CANCELLED':
				return 'Cancelada';
			case 'NO_SHOW':
				return 'Ausente';
			case 'RESCHEDULED':
				return 'Reagendada';
			default:
				return status;
		}
	}

	getStatusBadgeClasses(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'COMPLETED':
				return 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200';
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 shadow-sm';
			case 'PENDING_PAYMENT':
				return 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100';
			case 'CANCELLED':
			case 'NO_SHOW':
				return 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-secondary border border-red-100';
			default:
				return 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100';
		}
	}

	getBarPercent(value: number): number {
		if (!this.hasContent || this.agenda.stats.totalMonthAppointments <= 0) {
			return 0;
		}

		return Math.max(
			0,
			Math.min(
				100,
				Math.round((value / this.agenda.stats.totalMonthAppointments) * 100),
			),
		);
	}

	getAlertIcon(alert: ProviderAgendaAlert): string {
		switch (alert.type) {
			case 'PENDING_CONFIRMATION':
				return 'assignment_late';
			case 'NO_SHOW':
				return 'event_busy';
			default:
				return 'error';
		}
	}

	toggleMenu(appointmentId: string): void {
		this.openMenuAppointmentId =
			this.openMenuAppointmentId === appointmentId ? null : appointmentId;
	}

	isMenuOpen(appointmentId: string): boolean {
		return this.openMenuAppointmentId === appointmentId;
	}

	canConfirm(appointment: ProviderAgendaItem): boolean {
		return appointment.status === 'PENDING_PAYMENT';
	}

	canCall(appointment: ProviderAgendaItem): boolean {
		return (
			appointment.status === 'PENDING_PAYMENT' ||
			appointment.status === 'CONFIRMED'
		);
	}

	canStart(appointment: ProviderAgendaItem): boolean {
		return (
			appointment.status === 'CHECKED_IN' || appointment.status === 'CONFIRMED'
		);
	}

	canReenter(appointment: ProviderAgendaItem): boolean {
		return appointment.status === 'IN_PROGRESS';
	}

	canCancel(appointment: ProviderAgendaItem): boolean {
		return !['CANCELLED', 'COMPLETED', 'RESCHEDULED', 'NO_SHOW'].includes(
			appointment.status,
		);
	}

	showPlayButton(appointment: ProviderAgendaItem): boolean {
		return (
			appointment.status === 'CHECKED_IN' ||
			appointment.status === 'CONFIRMED' ||
			appointment.status === 'IN_PROGRESS'
		);
	}

	onPlayAction(appointment: ProviderAgendaItem): void {
		if (appointment.status === 'IN_PROGRESS') {
			this.openClinicalAttention(appointment, appointment.startTime);
			return;
		}

		if (appointment.status === 'CHECKED_IN') {
			this.applyStatusAction(appointment, 'START');
			return;
		}

		if (appointment.status === 'CONFIRMED') {
			this.applyStatusAction(appointment, 'CALL');
		}
	}

	onReenterAttention(appointment: ProviderAgendaItem): void {
		this.openMenuAppointmentId = null;
		this.openClinicalAttention(appointment, appointment.startTime);
	}

	onOpenPatientProfile(appointment: ProviderAgendaItem): void {
		this.openMenuAppointmentId = null;
		this.router.navigate(['/dashboard/provider/patients'], {
			queryParams: { patientId: appointment.patientId },
		});
	}

	openReschedulePanel(appointment: ProviderAgendaItem): void {
		this.openMenuAppointmentId = null;
		this.rescheduleAppointment = appointment;
		this.rescheduleDate = this.selectedDate;
		this.rescheduleSlots = [];
		this.selectedRescheduleSlotId = null;
		this.rescheduleErrorMessage = '';
		this.loadRescheduleSlots();
	}

	closeReschedulePanel(): void {
		this.rescheduleAppointment = null;
		this.rescheduleSlots = [];
		this.selectedRescheduleSlotId = null;
		this.rescheduleLoading = false;
		this.rescheduleSubmitting = false;
		this.rescheduleErrorMessage = '';
	}

	onRescheduleDateChange(date: string): void {
		this.rescheduleDate = date;
		this.selectedRescheduleSlotId = null;
		this.loadRescheduleSlots();
	}

	onSelectRescheduleSlot(slotId: string): void {
		this.selectedRescheduleSlotId = slotId;
	}

	isSelectedRescheduleSlot(slotId: string): boolean {
		return this.selectedRescheduleSlotId === slotId;
	}

	confirmReschedule(): void {
		if (
			!this.rescheduleAppointment ||
			!this.selectedRescheduleSlotId ||
			this.rescheduleSubmitting
		) {
			return;
		}

		this.rescheduleSubmitting = true;
		this.rescheduleErrorMessage = '';

		this.appointmentService
			.rescheduleProviderAppointment(this.rescheduleAppointment.id, {
				newSlotId: this.selectedRescheduleSlotId,
			})
			.subscribe({
				next: () => {
					this.rescheduleSubmitting = false;
					this.closeReschedulePanel();
					this.loadAgenda();
				},
				error: () => {
					this.rescheduleSubmitting = false;
					this.rescheduleErrorMessage =
						'No fue posible reagendar la cita en el slot seleccionado.';
				},
			});
	}

	applyStatusAction(
		appointment: ProviderAgendaItem,
		action: ProviderAppointmentStatusAction,
	): void {
		if (this.actionLoadingAppointmentId) {
			return;
		}

		this.openMenuAppointmentId = null;
		this.errorMessage = '';
		this.actionLoadingAppointmentId = appointment.id;

		const payload =
			action === 'CANCEL'
				? {
						action,
						cancellationReason: 'Cancelada por provider desde agenda',
					}
				: { action };

		this.appointmentService
			.updateProviderAppointmentStatus(appointment.id, payload)
			.subscribe({
				next: (response) => {
					this.actionLoadingAppointmentId = null;

					if (
						action === 'START' &&
						response.appointment.status === 'IN_PROGRESS'
					) {
						this.openClinicalAttention(appointment, new Date().toISOString());
						return;
					}

					this.loadAgenda();
				},
				error: () => {
					this.actionLoadingAppointmentId = null;
					this.errorMessage =
						'No fue posible ejecutar la accion sobre la cita seleccionada.';
				},
			});
	}

	private openClinicalAttention(
		appointment: ProviderAgendaItem,
		startedAt: string,
	): void {
		void this.router.navigate(['/dashboard/provider/clinical-attention'], {
			queryParams: {
				appointmentId: appointment.id,
				patientId: appointment.patientId,
				serviceId: appointment.serviceId,
				serviceName: appointment.serviceName,
			},
			state: {
				appointmentId: appointment.id,
				patientId: appointment.patientId,
				serviceId: appointment.serviceId,
				patientName: appointment.patientName,
				serviceName: appointment.serviceName,
				providerName: appointment.providerName ?? undefined,
				startedAt,
			},
		});
	}

	private onCalendarDateClick(arg: DateClickArg): void {
		this.selectedDate = arg.dateStr;
		this.selectedRangeStart = this.selectedDate;
		this.selectedRangeEnd = this.selectedDate;
		this.openMenuAppointmentId = null;
		if (this.rescheduleAppointment) {
			this.closeReschedulePanel();
		}
		this.loadAgenda();
	}

	private onCalendarRangeSelect(arg: DateSelectArg): void {
		this.selectedRangeStart = arg.startStr;
		this.selectedRangeEnd = this.getInclusiveRangeEnd(arg.endStr);
		this.selectedDate = this.selectedRangeStart;
		this.openMenuAppointmentId = null;
		if (this.rescheduleAppointment) {
			this.closeReschedulePanel();
		}
		this.loadAgenda();
	}

	private onCalendarDatesSet(arg: DatesSetArg): void {
		const newMonth = this.toMonthKey(arg.view.currentStart);
		if (newMonth === this.visibleMonth) {
			return;
		}

		this.visibleMonth = newMonth;
		if (this.rescheduleAppointment) {
			this.closeReschedulePanel();
		}
		this.loadAgenda();
	}

	private loadRescheduleSlots(): void {
		if (!this.rescheduleAppointment || !this.rescheduleDate) {
			this.rescheduleSlots = [];
			this.selectedRescheduleSlotId = null;
			return;
		}

		this.rescheduleLoading = true;
		this.rescheduleErrorMessage = '';

		this.appointmentService
			.getAvailableSlots(
				this.rescheduleAppointment.providerId,
				this.rescheduleAppointment.serviceId,
				this.rescheduleDate,
			)
			.subscribe({
				next: (slots) => {
					this.rescheduleSlots = slots.filter(
						(slot) => slot.available > 0 && slot.status === 'AVAILABLE',
					);
					this.rescheduleLoading = false;
				},
				error: () => {
					this.rescheduleSlots = [];
					this.selectedRescheduleSlotId = null;
					this.rescheduleLoading = false;
					this.rescheduleErrorMessage =
						'No fue posible cargar slots para reagendar en la fecha seleccionada.';
				},
			});
	}

	private loadAgenda(): void {
		this.loading = true;
		this.errorMessage = '';

		if (this.selectedRangeStart && this.selectedRangeEnd) {
			this.loadAgendaByRange(this.selectedRangeStart, this.selectedRangeEnd);
			return;
		}

		this.appointmentService
			.getProviderAgenda(this.selectedDate, undefined, this.visibleMonth)
			.subscribe({
				next: (response) => {
					this.agenda = response;
					this.selectedDate = response.date;
					this.visibleMonth = response.month;
					this.updateCalendarMarkers(response.calendarDays);
					this.loading = false;
				},
				error: () => {
					this.agenda = {
						date: this.selectedDate,
						month: this.visibleMonth,
						scope: 'SELF',
						selectedProviderId: null,
						appointments: [],
						calendarDays: [],
						stats: {
							totalMonthAppointments: 0,
							confirmedCount: 0,
							inProgressCount: 0,
							cancelledCount: 0,
							pendingCount: 0,
						},
						alerts: [],
					};
					this.updateCalendarMarkers([]);
					this.errorMessage =
						'No fue posible cargar la agenda medica del provider en este momento.';
					this.loading = false;
				},
			});
	}

	private loadAgendaByRange(rangeStart: string, rangeEnd: string): void {
		const dateKeys = this.buildDateRange(rangeStart, rangeEnd);
		const requests = dateKeys.map((dateKey) =>
			this.appointmentService.getProviderAgenda(
				dateKey,
				undefined,
				dateKey.slice(0, 7),
			),
		);

		forkJoin(requests).subscribe({
			next: (responses) => {
				const primaryResponse = responses[0];
				const mergedAppointments = responses
					.flatMap((response) => response.appointments)
					.sort((a, b) => {
						const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
						if (dateCmp !== 0) {
							return dateCmp;
						}

						return a.startTime.localeCompare(b.startTime);
					});

				this.agenda = {
					...primaryResponse,
					date: rangeStart,
					month: rangeStart.slice(0, 7),
					appointments: this.uniqueById(mergedAppointments),
				};
				this.selectedDate = rangeStart;
				this.visibleMonth = rangeStart.slice(0, 7);
				this.updateCalendarMarkers(primaryResponse.calendarDays);
				this.loading = false;
			},
			error: () => {
				this.agenda = {
					date: this.selectedDate,
					month: this.visibleMonth,
					scope: 'SELF',
					selectedProviderId: null,
					appointments: [],
					calendarDays: [],
					stats: {
						totalMonthAppointments: 0,
						confirmedCount: 0,
						inProgressCount: 0,
						cancelledCount: 0,
						pendingCount: 0,
					},
					alerts: [],
				};
				this.updateCalendarMarkers([]);
				this.errorMessage =
					'No fue posible cargar la agenda medica del rango seleccionado en este momento.';
				this.loading = false;
			},
		});
	}

	private updateCalendarMarkers(
		days: { date: string; appointments: number }[],
	): void {
		const events: EventInput[] = days.map((day) => ({
			id: day.date,
			date: day.date,
			title: `${day.appointments}`,
			allDay: true,
			classNames: ['provider-day-event'],
		}));

		this.calendarOptions = {
			...this.calendarOptions,
			events,
		};
	}

	private toDateKey(date: Date): string {
		return toColombiaDateKey(date);
	}

	private toMonthKey(date: Date): string {
		return toColombiaMonthKey(date);
	}

	private buildDateRange(start: string, end: string): string[] {
		const startDate = new Date(`${start}T00:00:00`);
		const endDate = new Date(`${end}T00:00:00`);
		const range: string[] = [];

		for (
			let cursor = new Date(startDate);
			cursor <= endDate;
			cursor.setDate(cursor.getDate() + 1)
		) {
			range.push(this.toDateKey(cursor));
		}

		return range;
	}

	private getInclusiveRangeEnd(exclusiveEnd: string): string {
		const endDate = new Date(`${exclusiveEnd}T00:00:00`);
		endDate.setDate(endDate.getDate() - 1);
		return this.toDateKey(endDate);
	}

	private uniqueById(rows: ProviderAgendaItem[]): ProviderAgendaItem[] {
		const map = new Map<string, ProviderAgendaItem>();
		for (const row of rows) {
			map.set(row.id, row);
		}

		return [...map.values()];
	}
}
