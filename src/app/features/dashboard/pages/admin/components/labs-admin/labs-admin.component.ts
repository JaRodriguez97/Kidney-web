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
	GetProviderLabsDashboardResponse,
	LabsDashboardService,
	ProviderLabDashboardCalendarDay,
	ProviderLabDashboardRow,
	ProviderLabStatus,
} from '@app/core/services/labs-dashboard.service';
import {
	formatColombiaDate,
	formatColombiaTime,
	toColombiaDateKey,
	toColombiaMonthKey,
} from '@app/shared/utils/colombia-date.utils';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
	selector: 'app-labs-admin',
	standalone: true,
	imports: [CommonModule, FormsModule, FullCalendarModule],
	templateUrl: './labs-admin.component.html',
	styleUrl: './labs-admin.component.scss',
})
export class LabsAdminComponent implements OnInit {
	private readonly labsDashboardService = inject(LabsDashboardService);

	loading = false;
	errorMessage = '';

	searchTerm = '';
	statusFilter: 'ALL' | ProviderLabStatus = 'ALL';
	selectedDate = this.toDateKey(new Date());
	selectedRangeStart: string | null = null;
	selectedRangeEnd: string | null = null;
	visibleMonth = this.toMonthKey(new Date());
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

	dashboard: GetProviderLabsDashboardResponse = {
		date: this.selectedDate,
		month: this.visibleMonth,
		scope: 'GLOBAL',
		selectedProviderId: null,
		rows: [],
		calendarDays: [],
		stats: {
			labsScheduled: 0,
			samplesInTake: 0,
			withoutValidation: 0,
			totalMonthAppointments: 0,
		},
	};

	ngOnInit(): void {
		this.loadDashboard();
	}

	get rows(): ProviderLabDashboardRow[] {
		return this.dashboard.rows;
	}

	get scopeLabel(): string {
		return this.dashboard.scope === 'GLOBAL' ? 'GLOBAL' : 'SELF';
	}

	get selectedProviderLabel(): string {
		return this.dashboard.selectedProviderId
			? this.dashboard.selectedProviderId.slice(0, 8)
			: 'N/A';
	}

	get hasMonthDataButEmptyDay(): boolean {
		return (
			this.rows.length === 0 &&
			this.dashboard.stats.totalMonthAppointments > 0 &&
			!this.loading &&
			!this.errorMessage
		);
	}

	onSearchChange(value: string): void {
		this.searchTerm = value;
		this.loadDashboard();
	}

	onStatusFilterChange(value: 'ALL' | ProviderLabStatus): void {
		this.statusFilter = value;
		this.loadDashboard();
	}

	onDateInputChange(value: string): void {
		this.selectedDate = value;
		this.selectedRangeStart = null;
		this.selectedRangeEnd = null;
		this.visibleMonth = value.slice(0, 7);
		this.loadDashboard();
	}

	onCalendarDateClick(arg: DateClickArg): void {
		this.selectedDate = this.toDateKey(arg.date);
		this.selectedRangeStart = this.selectedDate;
		this.selectedRangeEnd = this.selectedDate;
		this.visibleMonth = this.selectedDate.slice(0, 7);
		this.loadDashboard();
	}

	onCalendarRangeSelect(arg: DateSelectArg): void {
		this.selectedRangeStart = arg.startStr;
		this.selectedRangeEnd = this.getInclusiveRangeEnd(arg.endStr);
		this.selectedDate = this.selectedRangeStart;
		this.visibleMonth = this.selectedDate.slice(0, 7);
		this.loadDashboard();
	}

	onCalendarDatesSet(arg: DatesSetArg): void {
		const month = this.toMonthKey(arg.start);

		if (month === this.visibleMonth) {
			return;
		}

		this.visibleMonth = month;
		this.loadDashboard();
	}

	trackByRow(_: number, row: ProviderLabDashboardRow): string {
		return row.appointmentId;
	}

	getInitials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((chunk) => chunk[0]?.toUpperCase() ?? '')
			.join('');
	}

	getDocumentLabel(row: ProviderLabDashboardRow): string {
		if (!row.patientDocumentNumber) {
			return 'Sin identificacion';
		}

		return [row.patientDocumentType, row.patientDocumentNumber]
			.filter(Boolean)
			.join(' ');
	}

	formatDate(dateIso: string): string {
		return formatColombiaDate(`${dateIso}T00:00:00`);
	}

	formatTime(dateIso: string): string {
		const formatted = formatColombiaTime(dateIso);
		return formatted === '-' ? '--:--' : formatted;
	}

	getStatusBadgeClass(status: ProviderLabStatus): string {
		switch (status) {
			case 'SIN_VALIDAR':
				return 'badge bg-amber-50 text-amber-600 border-amber-200 uppercase';
			case 'TOMA':
				return 'badge bg-blue-50 text-blue-600 border-blue-200 uppercase';
			case 'PROCESADO':
				return 'badge bg-cyan-50 text-cyan-600 border-cyan-200 uppercase';
			case 'PREELIMINAR':
				return 'badge bg-purple-50 text-purple-600 border-purple-200 uppercase';
			default:
				return 'badge bg-red-50 text-secondary border-red-200 uppercase';
		}
	}

	private loadDashboard(): void {
		this.loading = true;
		this.errorMessage = '';

		if (this.selectedRangeStart && this.selectedRangeEnd) {
			this.loadDashboardByRange(this.selectedRangeStart, this.selectedRangeEnd);
			return;
		}

		const filteredRequest = this.labsDashboardService.getProviderDashboard({
			date: this.selectedDate,
			month: this.visibleMonth,
			search: this.searchTerm.trim() || undefined,
			status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
		});

		const calendarRequest = this.labsDashboardService.getProviderDashboard({
			date: this.selectedDate,
			month: this.visibleMonth,
		});

		forkJoin({
			filtered: filteredRequest.pipe(catchError(() => of(null))),
			calendar: calendarRequest.pipe(catchError(() => of(null))),
		}).subscribe({
			next: ({ filtered, calendar }) => {
				if (!filtered) {
					this.errorMessage =
						'No fue posible cargar la información de laboratorios en este momento.';
					this.dashboard = {
						date: this.selectedDate,
						month: this.visibleMonth,
						scope: 'GLOBAL',
						selectedProviderId: null,
						rows: [],
						calendarDays: [],
						stats: {
							labsScheduled: 0,
							samplesInTake: 0,
							withoutValidation: 0,
							totalMonthAppointments: 0,
						},
					};
				} else {
					this.dashboard = filtered;
					this.selectedDate = filtered.date;
					this.visibleMonth = filtered.month;
				}

				this.updateCalendarMarkers(calendar?.calendarDays ?? []);
				this.loading = false;
			},
			error: () => {
				this.errorMessage =
					'No fue posible cargar la información de laboratorios en este momento.';
				this.updateCalendarMarkers([]);
				this.loading = false;
			},
		});
	}

	private loadDashboardByRange(rangeStart: string, rangeEnd: string): void {
		const dateKeys = this.buildDateRange(rangeStart, rangeEnd);
		const filteredRequests = dateKeys.map((dateKey) =>
			this.labsDashboardService
				.getProviderDashboard({
					date: dateKey,
					month: dateKey.slice(0, 7),
					search: this.searchTerm.trim() || undefined,
					status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
				})
				.pipe(catchError(() => of(null))),
		);

		const calendarRequest = this.labsDashboardService
			.getProviderDashboard({
				date: this.selectedDate,
				month: this.visibleMonth,
			})
			.pipe(catchError(() => of(null)));

		forkJoin({
			filteredRange: forkJoin(filteredRequests),
			calendar: calendarRequest,
		}).subscribe({
			next: ({ filteredRange, calendar }) => {
				const validResponses = filteredRange.filter(
					(response): response is GetProviderLabsDashboardResponse => !!response,
				);

				if (!validResponses.length) {
					this.errorMessage =
						'No fue posible cargar la información de laboratorios en este momento.';
					this.dashboard = {
						date: rangeStart,
						month: this.visibleMonth,
						scope: 'GLOBAL',
						selectedProviderId: null,
						rows: [],
						calendarDays: [],
						stats: {
							labsScheduled: 0,
							samplesInTake: 0,
							withoutValidation: 0,
							totalMonthAppointments: 0,
						},
					};
					this.updateCalendarMarkers(calendar?.calendarDays ?? []);
					this.loading = false;
					return;
				}

				const mergedRows = this.uniqueRowsByAppointment(
					validResponses.flatMap((response) => response.rows),
				).sort((a, b) => {
					const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
					if (dateCmp !== 0) {
						return dateCmp;
					}

					return a.startTime.localeCompare(b.startTime);
				});

				this.dashboard = {
					date: rangeStart,
					month: this.visibleMonth,
					scope: validResponses[0].scope,
					selectedProviderId: validResponses[0].selectedProviderId,
					rows: mergedRows,
					calendarDays: calendar?.calendarDays ?? [],
					stats: {
						labsScheduled: mergedRows.filter((row) => row.status !== 'CANCELADO')
							.length,
						samplesInTake: mergedRows.filter((row) => row.status === 'TOMA').length,
						withoutValidation: mergedRows.filter(
							(row) => row.status === 'SIN_VALIDAR',
						).length,
						totalMonthAppointments:
							calendar?.stats.totalMonthAppointments ??
							validResponses[0].stats.totalMonthAppointments,
					},
				};

				this.selectedDate = rangeStart;
				this.visibleMonth = rangeStart.slice(0, 7);
				this.updateCalendarMarkers(calendar?.calendarDays ?? []);
				this.loading = false;
			},
			error: () => {
				this.errorMessage =
					'No fue posible cargar la información de laboratorios en este momento.';
				this.updateCalendarMarkers([]);
				this.loading = false;
			},
		});
	}

	private updateCalendarMarkers(days: ProviderLabDashboardCalendarDay[]): void {
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

	private uniqueRowsByAppointment(
		rows: ProviderLabDashboardRow[],
	): ProviderLabDashboardRow[] {
		const map = new Map<string, ProviderLabDashboardRow>();
		for (const row of rows) {
			map.set(row.appointmentId, row);
		}

		return [...map.values()];
	}
}
