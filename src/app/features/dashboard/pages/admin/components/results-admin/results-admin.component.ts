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
	AdminLabResultDashboardRow,
	AdminResultFilterStatus,
	GetAdminLabResultsDashboardResponse,
	LabResultDetailResponse,
	LabsDashboardService,
	ProviderLabDashboardCalendarDay,
} from '@app/core/services/labs-dashboard.service';
import {
	formatColombiaDate,
	toColombiaDateKey,
	toColombiaMonthKey,
} from '@app/shared/utils/colombia-date.utils';
import { catchError, forkJoin, of } from 'rxjs';

type ResultStatus = 'PENDIENTE_FIRMA' | 'PUBLICADO' | 'REVISION';

interface ResultAdminRow {
	appointmentId: string;
	resultStatus: 'DRAFT' | 'PENDING_VALIDATION' | 'PUBLISHED';
	patientName: string;
	patientRef: string;
	testName: string;
	signerName: string;
	validationDate: string;
	status: ResultStatus;
}

@Component({
	selector: 'app-results-admin',
	standalone: true,
	imports: [CommonModule, FormsModule, FullCalendarModule],
	templateUrl: './results-admin.component.html',
	styleUrl: './results-admin.component.scss',
})
export class ResultsAdminComponent implements OnInit {
	private readonly labsDashboardService = inject(LabsDashboardService);

	loading = false;
	errorMessage = '';
	detailLoading = false;
	detailError = '';

	searchTerm = '';
	statusFilter: 'ALL' | AdminResultFilterStatus = 'ALL';
	selectedDate = this.toDateKey(new Date());
	selectedRangeStart: string | null = null;
	selectedRangeEnd: string | null = null;
	visibleMonth = this.toMonthKey(new Date());
	publishingRows = new Set<string>();
	selectedResultDetail: LabResultDetailResponse | null = null;
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

	dashboard: GetAdminLabResultsDashboardResponse = {
		date: this.selectedDate,
		month: this.visibleMonth,
		rows: [],
		stats: {
			pendingValidation: 0,
			inRevision: 0,
			published: 0,
		},
	};

	ngOnInit(): void {
		this.loadDashboard();
	}

	get rows(): ResultAdminRow[] {
		return this.mapRows(this.dashboard.rows);
	}

	get readyCount(): number {
		return this.dashboard.stats.published;
	}

	get pendingSignatureCount(): number {
		return this.dashboard.stats.pendingValidation;
	}

	get sentTodayCount(): number {
		return this.dashboard.stats.published + this.dashboard.stats.inRevision;
	}

	onSearchChange(value: string): void {
		this.searchTerm = value;
		this.loadDashboard();
	}

	onStatusChange(value: 'ALL' | AdminResultFilterStatus): void {
		this.statusFilter = value;
		this.loadDashboard();
	}

	onDateChange(value: string): void {
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

	onOpenDetail(row: ResultAdminRow): void {
		this.detailLoading = true;
		this.detailError = '';
		this.selectedResultDetail = null;

		this.labsDashboardService.getResultDetail(row.appointmentId).subscribe({
			next: (detail) => {
				this.selectedResultDetail = detail;
				this.detailLoading = false;
			},
			error: () => {
				this.detailError =
					'No fue posible cargar el detalle del resultado en este momento.';
				this.detailLoading = false;
			},
		});
	}

	onCloseDetail(): void {
		this.selectedResultDetail = null;
		this.detailError = '';
	}

	onDownloadPdf(appointmentId: string): void {
		this.labsDashboardService.downloadResultPdf(appointmentId).subscribe({
			next: (blob) => {
				const fileName = `resultado-laboratorio-${appointmentId}.pdf`;
				const url = URL.createObjectURL(blob);
				const anchor = document.createElement('a');
				anchor.href = url;
				anchor.download = fileName;
				anchor.click();
				URL.revokeObjectURL(url);
			},
			error: () => {
				this.errorMessage =
					'No fue posible descargar el PDF del resultado en este momento.';
			},
		});
	}

	onPublishResult(row: ResultAdminRow): void {
		if (row.resultStatus !== 'PENDING_VALIDATION') {
			return;
		}

		this.publishingRows.add(row.appointmentId);
		this.labsDashboardService.publishResult(row.appointmentId).subscribe({
			next: () => {
				this.publishingRows.delete(row.appointmentId);
				this.loadDashboard();
			},
			error: () => {
				this.publishingRows.delete(row.appointmentId);
				this.errorMessage =
					'No fue posible publicar el resultado en este momento.';
			},
		});
	}

	isPublishing(appointmentId: string): boolean {
		return this.publishingRows.has(appointmentId);
	}

	canPublish(row: ResultAdminRow): boolean {
		return row.resultStatus === 'PENDING_VALIDATION';
	}

	trackByRow(_: number, row: ResultAdminRow): string {
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

	getStatusClass(status: ResultStatus): string {
		switch (status) {
			case 'PUBLICADO':
				return 'badge bg-green-50 text-green-700 border-green-200';
			case 'REVISION':
				return 'badge bg-red-50 text-red-700 border-red-200';
			default:
				return 'badge bg-amber-50 text-amber-700 border-amber-200';
		}
	}

	private loadDashboard(): void {
		this.loading = true;
		this.errorMessage = '';

		if (this.selectedRangeStart && this.selectedRangeEnd) {
			this.loadDashboardByRange(this.selectedRangeStart, this.selectedRangeEnd);
			return;
		}

		const filteredRequest = this.labsDashboardService.getAdminResultsDashboard({
			search: this.searchTerm.trim() || undefined,
			status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
			date: this.selectedDate,
			month: this.visibleMonth,
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
						'No fue posible cargar los resultados en este momento.';
					this.dashboard = {
						date: this.selectedDate,
						month: this.visibleMonth,
						rows: [],
						stats: {
							pendingValidation: 0,
							inRevision: 0,
							published: 0,
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
					'No fue posible cargar los resultados en este momento.';
				this.updateCalendarMarkers([]);
				this.loading = false;
			},
		});
	}

	private loadDashboardByRange(rangeStart: string, rangeEnd: string): void {
		const dateKeys = this.buildDateRange(rangeStart, rangeEnd);
		const filteredRequests = dateKeys.map((dateKey) =>
			this.labsDashboardService
				.getAdminResultsDashboard({
					search: this.searchTerm.trim() || undefined,
					status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
					date: dateKey,
					month: dateKey.slice(0, 7),
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
					(response): response is GetAdminLabResultsDashboardResponse => !!response,
				);

				if (!validResponses.length) {
					this.errorMessage =
						'No fue posible cargar los resultados en este momento.';
					this.dashboard = {
						date: rangeStart,
						month: this.visibleMonth,
						rows: [],
						stats: {
							pendingValidation: 0,
							inRevision: 0,
							published: 0,
						},
					};
					this.updateCalendarMarkers(calendar?.calendarDays ?? []);
					this.loading = false;
					return;
				}

				const mergedRows = this.uniqueRowsByAppointment(
					validResponses.flatMap((response) => response.rows),
				).sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

				this.dashboard = {
					date: rangeStart,
					month: this.visibleMonth,
					rows: mergedRows,
					stats: {
						pendingValidation: mergedRows.filter(
							(row) => row.resultStatus === 'PENDING_VALIDATION',
						).length,
						inRevision: mergedRows.filter((row) => row.resultStatus === 'DRAFT')
							.length,
						published: mergedRows.filter(
							(row) => row.resultStatus === 'PUBLISHED',
						).length,
					},
				};

				this.selectedDate = rangeStart;
				this.visibleMonth = rangeStart.slice(0, 7);
				this.updateCalendarMarkers(calendar?.calendarDays ?? []);
				this.loading = false;
			},
			error: () => {
				this.errorMessage =
					'No fue posible cargar los resultados en este momento.';
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

	private mapRows(rows: AdminLabResultDashboardRow[]): ResultAdminRow[] {
		return rows
			.filter((row) => row.appointmentStatus !== 'CANCELADO')
			.map((row) => ({
				appointmentId: row.appointmentId,
				resultStatus: row.resultStatus,
				patientName: row.patientName,
				patientRef: row.patientDocumentNumber
					? `${row.patientDocumentType ?? ''} ${row.patientDocumentNumber}`.trim()
					: row.appointmentId.slice(0, 8),
				testName: row.serviceName,
				signerName: row.technicianName ?? 'Sin asignar',
				validationDate: this.formatDate(row.validatedAt ?? row.scheduledDate),
				status: this.mapResultStatus(row.resultStatus),
			}));
	}

	private mapResultStatus(
		status: ResultAdminRow['resultStatus'],
	): ResultStatus {
		if (status === 'PUBLISHED') {
			return 'PUBLICADO';
		}

		if (status === 'DRAFT') {
			return 'REVISION';
		}

		return 'PENDIENTE_FIRMA';
	}

	private formatDate(rawDate: string): string {
		return formatColombiaDate(`${rawDate}T00:00:00`);
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
		rows: AdminLabResultDashboardRow[],
	): AdminLabResultDashboardRow[] {
		const map = new Map<string, AdminLabResultDashboardRow>();
		for (const row of rows) {
			map.set(row.appointmentId, row);
		}

		return [...map.values()];
	}
}
