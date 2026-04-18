import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PatientService,
  ProviderDashboardPatient,
  ProviderPatientRisk,
  ProviderPatientsResponse,
} from '@app/core/services/patient.service';

@Component({
  selector: 'app-patient-provider',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-provider.component.html',
  styleUrl: './patient-provider.component.scss',
  providers: [DatePipe],
})
export class PatientProviderComponent implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly datePipe = inject(DatePipe);

  patients: ProviderDashboardPatient[] = [];
  filteredPatients: ProviderDashboardPatient[] = [];

  loading = false;
  errorMessage = '';

  searchTerm = '';
  riskFilter: 'ALL' | ProviderPatientRisk = 'ALL';
  attentionFilter: 'ALL' | 'WEEK' | 'MONTH' | 'OVER_3_MONTHS' = 'ALL';

  stats: ProviderPatientsResponse['stats'] = {
    totalPatients: 0,
    highRiskPatients: 0,
    moderateRiskPatients: 0,
    lowRiskPatients: 0,
    unclassifiedRiskPatients: 0,
  };

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.errorMessage = '';

    this.patientService.getProviderPatients().subscribe({
      next: (response) => {
        this.patients = response.patients;
        this.stats = response.stats;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'No fue posible cargar los pacientes del provider.';
        this.patients = [];
        this.filteredPatients = [];
        this.stats = {
          totalPatients: 0,
          highRiskPatients: 0,
          moderateRiskPatients: 0,
          lowRiskPatients: 0,
          unclassifiedRiskPatients: 0,
        };
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredPatients = this.patients.filter((patient) => {
      const matchesSearch =
        !term ||
        patient.fullName.toLowerCase().includes(term) ||
        (patient.documentType ?? '').toLowerCase().includes(term);

      const matchesRisk =
        this.riskFilter === 'ALL' || patient.riskLevel === this.riskFilter;

      const matchesAttentionWindow = this.matchesAttentionFilter(
        patient.lastAttentionDate,
      );

      return matchesSearch && matchesRisk && matchesAttentionWindow;
    });
  }

  trackByPatient(_: number, patient: ProviderDashboardPatient): string {
    return patient.patientId;
  }

  formatDate(dateInput: string): string {
    const formatted = this.datePipe.transform(dateInput, 'dd MMM yyyy');
    return formatted ?? '-';
  }

  getRiskLabel(risk: ProviderPatientRisk): string {
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

  getRiskClasses(risk: ProviderPatientRisk): string {
    switch (risk) {
      case 'HIGH':
        return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-secondary border border-red-100';
      case 'MODERATE':
        return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100';
      case 'LOW':
        return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100';
      default:
        return 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200';
    }
  }

  private matchesAttentionFilter(lastAttentionDate: string): boolean {
    if (this.attentionFilter === 'ALL') {
      return true;
    }

    const attentionDate = new Date(lastAttentionDate);
    if (Number.isNaN(attentionDate.getTime())) {
      return false;
    }

    const now = new Date();
    const msDiff = now.getTime() - attentionDate.getTime();
    const daysDiff = Math.floor(msDiff / (1000 * 60 * 60 * 24));

    switch (this.attentionFilter) {
      case 'WEEK':
        return daysDiff <= 7;
      case 'MONTH':
        return daysDiff <= 30;
      case 'OVER_3_MONTHS':
        return daysDiff > 90;
      default:
        return true;
    }
  }

}
