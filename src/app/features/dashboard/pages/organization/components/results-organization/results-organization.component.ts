import { Component, inject, OnInit } from '@angular/core';
import { OrganizationService } from '@app/core/services/organization.service';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '@env/environment';

@Component({
	selector: 'app-results-organization',
	standalone: true,
	imports: [NgClass, DatePipe, FormsModule],
	templateUrl: './results-organization.component.html',
	styleUrl: './results-organization.component.scss',
})
export class ResultsOrganizationComponent implements OnInit {
	private readonly organizationService = inject(OrganizationService);

	loading = true;
	results: any[] = [];
	total = 0;
	page = 1;
	limit = 10;
	search = '';
	date = '';
	metrics = {
		opportunity: 85,
		totalToday: 0,
		pending: 0,
	};

	// Organization Details
	organizationName = '';
	organizationNit = '';
	contactPersonName = '';

	ngOnInit(): void {
		this.date = new Date().toISOString().split('T')[0];
		this.loadOrganizationDetails();
		this.loadResults();
	}

	loadOrganizationDetails(): void {
		this.organizationService.getDashboard({ limit: 1 }).subscribe({
			next: (res) => {
				if (res && res.organization) {
					this.organizationName = res.organization.legalName;
					this.organizationNit = res.organization.documentNumber;
				}
			},
			error: (err) => {
				console.error('Error loading organization details', err);
			}
		});

		this.organizationService.getProfile().subscribe({
			next: (profile) => {
				if (profile && profile.contact_person_name) {
					this.contactPersonName = profile.contact_person_name;
				}
			},
			error: (err) => {
				console.error('Error loading organization profile details', err);
			}
		});
	}

	loadResults(): void {
		this.loading = true;
		this.organizationService
			.getResults({
				search: this.search.trim() || undefined,
				date: this.date || undefined,
				page: this.page,
				limit: this.limit,
			})
			.subscribe({
				next: (response) => {
					this.results = response.data;
					this.total = response.total;
					this.metrics = response.metrics;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading results', error);
					this.loading = false;
				},
			});
	}

	onSearch(): void {
		this.page = 1;
		this.loadResults();
	}

	onDateChange(): void {
		this.page = 1;
		this.loadResults();
	}

	prevPage(): void {
		if (this.page > 1) {
			this.page--;
			this.loadResults();
		}
	}

	nextPage(): void {
		if (this.page * this.limit < this.total) {
			this.page++;
			this.loadResults();
		}
	}

	downloadPdf(appointmentId: string): void {
		// Abrir en nueva pestaña (requiere autenticación, pero el navegador redirigirá o descargará)
		// Nota: en una app real con token en LocalStorage, suele ser un fetch con headers Auth que guarda el blob,
		// o el token se pasa por query param para URLs directas de descargas.
		const token = localStorage.getItem('token') || '';
		const url = `${environment.apiUrl}labs/${appointmentId}/result/pdf?token=${token}`;
		window.open(url, '_blank');
	}

	getInitials(name: string): string {
		if (!name) return 'UN';
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return parts[0].substring(0, 2).toUpperCase();
	}
}
