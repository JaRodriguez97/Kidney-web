import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
	AppointmentService,
	ProviderAgendaCalendarDay,
	ProviderAgendaItem,
} from '@app/core/services/appointment.service';
import {
	formatColombiaDate,
	formatColombiaTime,
	toColombiaDateKey,
	toColombiaMonthKey,
} from '@app/shared/utils/colombia-date.utils';
import { forkJoin } from 'rxjs';

@Component({
	selector: 'app-appointment-admin',
	standalone: true,
	imports: [CommonModule, FormsModule, FullCalendarModule],
	templateUrl: './appointment-admin.component.html',
	styleUrl: './appointment-admin.component.scss',
})
export class AppointmentAdminComponent implements OnInit {
	private readonly appointmentService = inject(AppointmentService);

	loading = false;
	errorMessage = '';

	searchTerm = '';
	statusFilter: 'ALL' | ProviderAgendaItem['status'] = 'ALL';
	selectedDate = this.toDateKey(new Date());
	selectedRangeStart: string | null = null;
	selectedRangeEnd: string | null = null;
	visibleMonth = this.toMonthKey(new Date());

	appointments: ProviderAgendaItem[] = [];
	calendarOptions: CalendarOptions = {
		plugins: [dayGridPlugin, interactionPlugin],
		initialView: 'dayGridMonth',
		locale: esLocale,
		headerToolbar: {
			left: 'prev',
			center: 'title',
			right: 'next',
		},
		contentHeight: 300,
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

	get filteredAppointments(): ProviderAgendaItem[] {
		const normalizedSearch = this.searchTerm.trim().toLowerCase();

		return this.appointments.filter((row) => {
			const matchesStatus =
				this.statusFilter === 'ALL' || row.status === this.statusFilter;

			if (!matchesStatus) {
				return false;
			}

			if (!normalizedSearch.length) {
				return true;
			}

			const haystack = [
				row.patientName,
				row.providerName ?? '',
				row.serviceName,
			]
				.join(' ')
				.toLowerCase();

			return haystack.includes(normalizedSearch);
		});
	}

	get totalToday(): number {
		return this.filteredAppointments.length;
	}

	get pendingToday(): number {
		return this.filteredAppointments.filter((row) =>
			['PENDING_PAYMENT', 'CONFIRMED'].includes(row.status),
		).length;
	}

	get cancelledToday(): number {
		return this.filteredAppointments.filter((row) =>
			['CANCELLED', 'NO_SHOW', 'RESCHEDULED'].includes(row.status),
		).length;
	}

	onSearchChange(value: string): void {
		this.searchTerm = value;
	}

	onStatusChange(value: 'ALL' | ProviderAgendaItem['status']): void {
		this.statusFilter = value;
	}

	onDateChange(value: string): void {
		this.selectedDate = value;
		this.selectedRangeStart = null;
		this.selectedRangeEnd = null;
		this.visibleMonth = value.slice(0, 7);
		this.loadAgenda();
	}

	onCalendarDateClick(arg: DateClickArg): void {
		this.selectedDate = this.toDateKey(arg.date);
		this.selectedRangeStart = this.selectedDate;
		this.selectedRangeEnd = this.selectedDate;
		this.visibleMonth = this.selectedDate.slice(0, 7);
		this.loadAgenda();
	}

	onCalendarRangeSelect(arg: DateSelectArg): void {
		this.selectedRangeStart = arg.startStr;
		this.selectedRangeEnd = this.getInclusiveRangeEnd(arg.endStr);
		this.selectedDate = this.selectedRangeStart;
		this.visibleMonth = this.selectedDate.slice(0, 7);
		this.loadAgenda();
	}

	onCalendarDatesSet(arg: DatesSetArg): void {
		const month = this.toMonthKey(arg.start);

		if (month === this.visibleMonth) {
			return;
		}

		this.visibleMonth = month;
		this.loadAgenda();
	}

	trackByRow(_: number, row: ProviderAgendaItem): string {
		return row.id;
	}

	getInitials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((chunk) => chunk[0]?.toUpperCase() ?? '')
			.join('');
	}

	getPatientReference(row: ProviderAgendaItem): string {
		return `ID: ${row.patientId.slice(0, 8)}...`;
	}

	formatDate(isoDate: string): string {
		return formatColombiaDate(`${isoDate}T00:00:00`);
	}

	formatTime(isoDate: string): string {
		const formatted = formatColombiaTime(isoDate);
		return formatted === '-' ? '--:--' : formatted;
	}

	getStatusLabel(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'PENDING_PAYMENT':
				return 'PENDIENTE';
			case 'CONFIRMED':
				return 'CONFIRMADA';
			case 'CHECKED_IN':
				return 'EN SALA';
			case 'IN_PROGRESS':
				return 'EN CURSO';
			case 'COMPLETED':
				return 'FINALIZADA';
			case 'NO_SHOW':
				return 'AUSENTE';
			case 'RESCHEDULED':
				return 'REAGENDADA';
			default:
				return 'CANCELADA';
		}
	}

	getStatusClass(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'PENDING_PAYMENT':
				return 'badge bg-amber-50 text-amber-700 border-amber-200';
			case 'CONFIRMED':
				return 'badge bg-green-50 text-green-700 border-green-200';
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'badge bg-blue-50 text-blue-700 border-blue-200';
			case 'COMPLETED':
				return 'badge bg-slate-100 text-slate-600 border-slate-200';
			case 'NO_SHOW':
				return 'badge bg-purple-50 text-purple-700 border-purple-200';
			case 'RESCHEDULED':
				return 'badge bg-cyan-50 text-cyan-700 border-cyan-200';
			default:
				return 'badge bg-red-50 text-red-700 border-red-200';
		}
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
					this.appointments = response.appointments;
					this.selectedDate = response.date;
					this.visibleMonth = response.month;
					this.updateCalendarMarkers(response.calendarDays);
					this.loading = false;
				},
				error: () => {
					this.errorMessage =
						'No fue posible cargar las citas del día en este momento.';
					this.appointments = [];
					this.updateCalendarMarkers([]);
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

				this.appointments = this.uniqueById(mergedAppointments);
				this.selectedDate = rangeStart;
				this.visibleMonth = rangeStart.slice(0, 7);
				this.updateCalendarMarkers(primaryResponse?.calendarDays ?? []);
				this.loading = false;
			},
			error: () => {
				this.errorMessage =
					'No fue posible cargar las citas del rango seleccionado en este momento.';
				this.appointments = [];
				this.updateCalendarMarkers([]);
				this.loading = false;
			},
		});
	}

	private updateCalendarMarkers(days: ProviderAgendaCalendarDay[]): void {
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
