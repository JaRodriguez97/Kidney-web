import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	AdminLabResultDashboardRow,
	AdminResultFilterStatus,
	GetAdminLabResultsDashboardResponse,
	LabResultDetailResponse,
	LabsDashboardService,
} from '@app/core/services/labs-dashboard.service';

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
	imports: [CommonModule, FormsModule],
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
	visibleMonth = this.toMonthKey(new Date());
	publishingRows = new Set<string>();
	selectedResultDetail: LabResultDetailResponse | null = null;

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
		this.visibleMonth = value.slice(0, 7);
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

		this.labsDashboardService
			.getAdminResultsDashboard({
				search: this.searchTerm.trim() || undefined,
				status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
				date: this.selectedDate,
				month: this.visibleMonth,
			})
			.subscribe({
				next: (response) => {
					this.dashboard = response;
					this.selectedDate = response.date;
					this.visibleMonth = response.month;
					this.loading = false;
				},
				error: () => {
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
					this.loading = false;
				},
			});
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

	private mapResultStatus(status: ResultAdminRow['resultStatus']): ResultStatus {
		if (status === 'PUBLISHED') {
			return 'PUBLICADO';
		}

		if (status === 'DRAFT') {
			return 'REVISION';
		}

		return 'PENDIENTE_FIRMA';
	}

	private formatDate(rawDate: string): string {
		const parsed = new Date(`${rawDate}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) {
			return '--';
		}

		return parsed.toLocaleDateString('es-CO', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	}

	private toDateKey(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	private toMonthKey(date: Date): string {
		return date.toISOString().slice(0, 7);
	}
}
