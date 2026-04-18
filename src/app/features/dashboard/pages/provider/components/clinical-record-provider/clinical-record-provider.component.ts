import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	ClinicalRecordRisk,
	ClinicalRecordService,
	ProviderClinicalRecordItem,
	ProviderClinicalRecordStats,
} from '@app/core/services/clinical-record.service';

@Component({
	selector: 'app-clinical-record-provider',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './clinical-record-provider.component.html',
	styleUrl: './clinical-record-provider.component.scss',
	providers: [DatePipe],
})
export class ClinicalRecordProviderComponent implements OnInit {
	private readonly clinicalRecordService = inject(ClinicalRecordService);
	private readonly datePipe = inject(DatePipe);

	records: ProviderClinicalRecordItem[] = [];
	filteredRecords: ProviderClinicalRecordItem[] = [];

	loading = false;
	errorMessage = '';

	searchTerm = '';
	riskFilter: 'ALL' | ClinicalRecordRisk = 'ALL';
	fromDate = '';

	stats: ProviderClinicalRecordStats = {
		totalPatients: 0,
		completedHistoriesPercentage: 0,
		criticalRiskPercentage: 0,
		averageVisitsPerPatient: 0,
		followUpRequiredPatients: 0,
	};

	ngOnInit(): void {
		this.loadRecords();
	}

	get hasContent(): boolean {
		return this.stats.totalPatients > 0;
	}

	loadRecords(): void {
		this.loading = true;
		this.errorMessage = '';

		this.clinicalRecordService.getProviderDashboard().subscribe({
			next: (response) => {
				this.records = response.patients;
				this.stats = response.stats;
				this.applyFilters();
				this.loading = false;
			},
			error: () => {
				this.records = [];
				this.filteredRecords = [];
				this.stats = {
					totalPatients: 0,
					completedHistoriesPercentage: 0,
					criticalRiskPercentage: 0,
					averageVisitsPerPatient: 0,
					followUpRequiredPatients: 0,
				};
				this.errorMessage =
					'No fue posible cargar la historia clinica del provider en este momento.';
				this.loading = false;
			},
		});
	}

	applyFilters(): void {
		const term = this.searchTerm.trim().toLowerCase();

		this.filteredRecords = this.records.filter((record) => {
			const matchesSearch =
				!term ||
				record.fullName.toLowerCase().includes(term) ||
				this.getIdentificationLabel(record).toLowerCase().includes(term) ||
				(record.lastDiagnosis ?? '').toLowerCase().includes(term);

			const matchesRisk =
				this.riskFilter === 'ALL' || record.riskLevel === this.riskFilter;

			const matchesDate = this.matchesFromDate(record.lastAttentionDate);

			return matchesSearch && matchesRisk && matchesDate;
		});
	}

	trackByRecord(_: number, record: ProviderClinicalRecordItem): string {
		return record.patientId;
	}

	getInitials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('');
	}

	getIdentificationLabel(record: ProviderClinicalRecordItem): string {
		if (!record.documentType && !record.documentNumber) {
			return 'No disponible';
		}

		return [record.documentType, record.documentNumber]
			.filter(Boolean)
			.join(' ');
	}

	getAgeLabel(age: number | null): string {
		return age === null ? 'Edad no disponible' : `${age} Años`;
	}

	formatDate(date: string | null): string {
		if (!date) {
			return 'Sin consultas registradas';
		}

		return this.datePipe.transform(date, 'dd MMM yyyy') ?? 'Sin fecha';
	}

	getRiskLabel(risk: ClinicalRecordRisk): string {
		switch (risk) {
			case 'HIGH':
				return 'Alto';
			case 'MODERATE':
				return 'Moderado';
			case 'LOW':
				return 'Bajo';
			default:
				return 'Sin clasificar';
		}
	}

	getRiskClasses(risk: ClinicalRecordRisk): string {
		switch (risk) {
			case 'HIGH':
				return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200';
			case 'MODERATE':
				return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200';
			case 'LOW':
				return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200';
			default:
				return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200';
		}
	}

	getRiskIcon(risk: ClinicalRecordRisk): string {
		switch (risk) {
			case 'HIGH':
				return 'error';
			case 'MODERATE':
				return 'warning';
			case 'LOW':
				return 'check_circle';
			default:
				return 'help';
		}
	}

	getAverageVisitsProgress(): number {
		if (!this.hasContent) {
			return 0;
		}

		// Escala visual: 5 consultas/año representa 100% de la barra.
		const progress = (this.stats.averageVisitsPerPatient / 5) * 100;
		return Math.max(0, Math.min(100, Number(progress.toFixed(1))));
	}

	private matchesFromDate(lastAttentionDate: string | null): boolean {
		if (!this.fromDate) {
			return true;
		}

		if (!lastAttentionDate) {
			return false;
		}

		const recordDate = new Date(lastAttentionDate);
		const fromDate = new Date(`${this.fromDate}T00:00:00`);

		if (
			Number.isNaN(recordDate.getTime()) ||
			Number.isNaN(fromDate.getTime())
		) {
			return false;
		}

		return recordDate >= fromDate;
	}
}
