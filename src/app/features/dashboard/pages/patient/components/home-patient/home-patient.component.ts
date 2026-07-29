import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-home-patient',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './home-patient.component.html',
	styleUrl: './home-patient.component.scss',
})
export class HomePatientComponent implements OnInit, OnDestroy {
	isLoading = true;

	// Estas banderas quedan listas para conectarse al backend en una siguiente etapa.
	hasUpcomingAppointment = false;
	hasResults = false;
	hasHealthEvolution = false;
	hasDocuments = false;

	selectedGraphRange: '6M' | '1Y' = '6M';

	private loadingTimer?: ReturnType<typeof setTimeout>;

	constructor(private readonly router: Router) {}

	ngOnInit(): void {
		this.loadingTimer = setTimeout(() => {
			this.isLoading = false;
		}, 1400);
	}

	ngOnDestroy(): void {
		if (this.loadingTimer) {
			clearTimeout(this.loadingTimer);
		}
	}

	goToScheduleAppointment(): void {
		this.router.navigate(['/dashboard/patient/appointments/schedule']);
	}

	goToDocuments(): void {
		this.router.navigate(['/dashboard/patient/documents']);
	}

	goToSupport(): void {
		this.router.navigate(['/dashboard/patient/support']);
	}

	setGraphRange(range: '6M' | '1Y'): void {
		this.selectedGraphRange = range;
	}

	downloadResult(resultName: string): void {
		alert(`Preparando PDF para descarga simulada de: ${resultName}`);
	}

	viewAllResults(): void {
		this.router.navigate(['/dashboard/patient/results']);
	}
}
