import { Component, inject, OnInit } from '@angular/core';
import { OrganizationService } from '@app/core/services/organization.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientDetailModalComponent } from '../patient-detail-modal/patient-detail-modal.component';
import { ClinicBranchService, ClinicBranchResponse } from '@app/core/services/clinic-branch.service';

@Component({
	selector: 'app-patients-organization',
	standalone: true,
	imports: [ DatePipe, FormsModule, PatientDetailModalComponent],
	templateUrl: './patients-organization.component.html',
	styleUrl: './patients-organization.component.scss',
})
export class PatientsOrganizationComponent implements OnInit {
	private readonly organizationService = inject(OrganizationService);
	private readonly clinicBranchService = inject(ClinicBranchService);

	loading = true;
	patients: any[] = [];
	filteredPatients: any[] = [];
	total = 0;
	page = 1;
	limit = 10;
	search = '';
	selectedPatientId: string | null = null;

	// Organization Details
	organizationName = '';
	organizationNit = '';
	contactPersonName = '';

	// Filters
	clinicBranches: ClinicBranchResponse[] = [];
	selectedBranchName = '';
	selectedDate = '';

	ngOnInit(): void {
		this.selectedDate = new Date().toISOString().split('T')[0];
		this.loadOrganizationDetails();
		this.loadClinicBranches();
		this.loadPatients();
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

	loadClinicBranches(): void {
		this.clinicBranchService.getClinicBranches().subscribe({
			next: (branches) => {
				this.clinicBranches = branches || [];
			},
			error: (err) => {
				console.error('Error loading clinic branches', err);
			}
		});
	}

	loadPatients(): void {
		this.loading = true;
		this.organizationService
			.getPatients({
				search: this.search.trim() || undefined,
				page: this.page,
				limit: this.limit,
			})
			.subscribe({
				next: (response) => {
					this.patients = response.data;
					this.total = response.total;
					this.applyFilters();
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading patients', error);
					this.loading = false;
				},
			});
	}

	applyFilters(): void {
		this.filteredPatients = this.patients.filter((p) => {
			const matchesBranch = !this.selectedBranchName || p.city === this.selectedBranchName;
			let matchesDate = true;
			if (this.selectedDate) {
				if (p.lastActivityAt) {
					const activityDate = p.lastActivityAt.split('T')[0];
					matchesDate = activityDate === this.selectedDate;
				} else {
					matchesDate = false;
				}
			}
			return matchesBranch && matchesDate;
		});
	}

	onSearch(): void {
		this.page = 1;
		this.loadPatients();
	}

	viewDetail(patientId: string): void {
		this.selectedPatientId = patientId;
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
