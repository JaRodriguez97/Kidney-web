import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
	ClinicalRecordService,
	PatientRecentHistoryItem,
} from '@app/core/services/clinical-record.service';
import { formatColombiaDate } from '@app/shared/utils/colombia-date.utils';

@Component({
	selector: 'app-clinical-record-patient',
	standalone: true,
	imports: [CommonModule, FullCalendarModule],
	templateUrl: './clinical-record-patient.component.html',
	styleUrl: './clinical-record-patient.component.scss',
})
export class ClinicalRecordPatientComponent implements OnInit {
	private readonly clinicalRecordService = inject(ClinicalRecordService);

	records: PatientRecentHistoryItem[] = [];
	loading = false;
	errorMessage = '';
	downloadingCareId: string | null = null;
	selectedDateFilter = '';

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
		selectable: false,
		events: [],
		dateClick: (arg) => this.onCalendarDateClick(arg),
	};

	ngOnInit(): void {
		this.loadRecentHistory();
	}

	loadRecentHistory(): void {
		this.loading = true;
		this.errorMessage = '';

		this.clinicalRecordService.getMyRecentHistory(10).subscribe({
			next: (records) => {
				this.records = records.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				);
				this.refreshCalendarEvents();
				this.loading = false;
			},
			error: () => {
				this.records = [];
				this.errorMessage =
					'No fue posible cargar tu historial de atenciones en este momento.';
				this.loading = false;
			},
		});
	}

	downloadSummary(record: PatientRecentHistoryItem): void {
		if (!record.careId || this.downloadingCareId) {
			return;
		}

		this.downloadingCareId = record.careId;
		this.clinicalRecordService
			.downloadDigitalAttentionSummary(record.careId)
			.subscribe({
				next: (blob) => {
					const fileName = `resumen-digital-atencion-${record.careId}.pdf`;
					const objectUrl = window.URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.href = objectUrl;
					link.download = fileName;
					link.click();
					window.URL.revokeObjectURL(objectUrl);
					this.downloadingCareId = null;
				},
				error: () => {
					this.errorMessage =
						'No fue posible descargar el resumen digital de atencion.';
					this.downloadingCareId = null;
				},
			});
	}

	formatDate(date: string): string {
		return formatColombiaDate(date);
	}

	get filteredRecords(): PatientRecentHistoryItem[] {
		if (!this.selectedDateFilter) {
			return this.records;
		}

		return this.records.filter((record) => {
			const recordDate = new Date(record.date);
			const parsedFilterDate = new Date(`${this.selectedDateFilter}T00:00:00`);

			if (
				Number.isNaN(recordDate.getTime()) ||
				Number.isNaN(parsedFilterDate.getTime())
			) {
				return false;
			}

			return (
				recordDate.getUTCFullYear() === parsedFilterDate.getUTCFullYear() &&
				recordDate.getUTCMonth() === parsedFilterDate.getUTCMonth() &&
				recordDate.getUTCDate() === parsedFilterDate.getUTCDate()
			);
		});
	}

	get totalRecords(): number {
		return this.records.length;
	}

	get latestRecord(): PatientRecentHistoryItem | null {
		return this.records[0] ?? null;
	}

	clearDateFilter(): void {
		this.selectedDateFilter = '';
	}

	private onCalendarDateClick(arg: DateClickArg): void {
		this.selectedDateFilter = arg.dateStr;
	}

	private refreshCalendarEvents(): void {
		const eventCounts = new Map<string, number>();

		for (const record of this.records) {
			const dateKey = record.date.slice(0, 10);
			eventCounts.set(dateKey, (eventCounts.get(dateKey) ?? 0) + 1);
		}

		const events: EventInput[] = Array.from(eventCounts.entries()).map(
			([date, count]) => ({
				title: count > 1 ? `${count} atenciones` : '1 atencion',
				date,
				allDay: true,
				backgroundColor: '#1c384e',
				borderColor: '#1c384e',
				textColor: '#ffffff',
			}),
		);

		this.calendarOptions = {
			...this.calendarOptions,
			events,
		};
	}
}
