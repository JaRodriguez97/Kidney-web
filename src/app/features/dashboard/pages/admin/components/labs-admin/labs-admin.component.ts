import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	GetProviderLabsDashboardResponse,
	LabsDashboardService,
	ProviderLabDashboardRow,
	ProviderLabStatus,
} from '@app/core/services/labs-dashboard.service';

@Component({
	selector: 'app-labs-admin',
	standalone: true,
	imports: [CommonModule, FormsModule],
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
	visibleMonth = this.toMonthKey(new Date());

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
		this.visibleMonth = value.slice(0, 7);
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
		const parsed = new Date(`${dateIso}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) {
			return '--';
		}

		return parsed.toLocaleDateString('es-CO', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	}

	formatTime(dateIso: string): string {
		const parsed = new Date(dateIso);
		if (Number.isNaN(parsed.getTime())) {
			return '--:--';
		}

		return parsed.toLocaleTimeString('es-CO', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		});
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

		this.labsDashboardService
			.getProviderDashboard({
				date: this.selectedDate,
				month: this.visibleMonth,
				search: this.searchTerm.trim() || undefined,
				status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
			})
			.subscribe({
				next: (response) => {
					this.dashboard = response;
					this.loading = false;
				},
				error: () => {
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
					this.loading = false;
				},
			});
	}

	private toDateKey(date: Date): string {
		return date.toISOString().slice(0, 10);
	}

	private toMonthKey(date: Date): string {
		return date.toISOString().slice(0, 7);
	}
}
