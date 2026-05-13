import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	LabResultDetailResponse,
	PatientLabResultRow,
	LabsDashboardService,
} from '@app/core/services/labs-dashboard.service';
import { formatColombiaDate } from '@app/shared/utils/colombia-date.utils';

@Component({
  selector: 'app-results-patient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './results-patient.component.html',
  styleUrl: './results-patient.component.scss',
})
export class ResultsPatientComponent implements OnInit {
  private readonly labsDashboardService = inject(LabsDashboardService);

  loading = false;
  detailLoading = false;
  errorMessage = '';
  detailError = '';

  searchTerm = '';
  selectedDate = '';

  rows: PatientLabResultRow[] = [];
  selectedDetail: LabResultDetailResponse | null = null;

  ngOnInit(): void {
    this.loadRows();
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.loadRows();
  }

  onDateChange(value: string): void {
    this.selectedDate = value;
    this.loadRows();
  }

  onSelectRow(row: PatientLabResultRow): void {
    this.detailLoading = true;
    this.detailError = '';
    this.selectedDetail = null;

    this.labsDashboardService.getResultDetail(row.appointmentId).subscribe({
      next: (detail) => {
        this.selectedDetail = detail;
        this.detailLoading = false;
      },
      error: () => {
        this.detailError =
          'No fue posible cargar el detalle del resultado en este momento.';
        this.detailLoading = false;
      },
    });
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

  getStatusClass(row: PatientLabResultRow): string {
    if (row.resultStatus === 'PUBLISHED') {
      return 'px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-100';
    }

    if (row.resultStatus === 'PENDING_VALIDATION') {
      return 'px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100';
    }

    return 'px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200';
  }

  formatDate(rawDate: string): string {
    return formatColombiaDate(`${rawDate}T00:00:00`);
  }

  private loadRows(): void {
    this.loading = true;
    this.errorMessage = '';

    this.labsDashboardService
      .getMyResults({
        search: this.searchTerm.trim() || undefined,
        date: this.selectedDate || undefined,
      })
      .subscribe({
        next: (response) => {
          this.rows = response.rows;
          this.loading = false;
        },
        error: () => {
          this.rows = [];
          this.errorMessage =
            'No fue posible cargar tus resultados de laboratorio en este momento.';
          this.loading = false;
        },
      });
  }

}
