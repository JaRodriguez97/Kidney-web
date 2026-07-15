import { Component, inject, OnInit } from '@angular/core';
import { OrganizationService } from '@app/core/services/organization.service';
import { ServicePackageService } from '@app/core/services/service-package.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-clinical-requests-organization',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './clinical-requests-organization.component.html',
	styleUrl: './clinical-requests-organization.component.scss',
})
export class ClinicalRequestsOrganizationComponent implements OnInit {
	private readonly organizationService = inject(OrganizationService);
	private readonly servicePackageService = inject(ServicePackageService);

	loading = true;
	requests: any[] = [];
	total = 0;
	page = 1;
	limit = 10;
	search = '';
	date = '';

	// Organization Details
	organizationName = '';
	organizationNit = '';
	contactPersonName = '';

	// Modal State
	isModalVisible = false;
	selectedMode: 'SINGLE' | 'BATCH' = 'SINGLE';
	patientsList: any[] = [];
	packagesList: any[] = [];
	
	// Detail Modal State
	isDetailModalVisible = false;
	selectedRequestDetail: any = null;
	
	// Modal Form fields
	selectedPatientId = '';
	selectedPatientIds: { [key: string]: boolean } = {};
	selectedPackageId = '';
	
	submitting = false;
	modalErrorMessage = '';
	modalSuccessMessage = '';

	ngOnInit(): void {
		this.date = new Date().toISOString().split('T')[0];
		this.loadOrganizationDetails();
		this.loadRequests();
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

	loadRequests(): void {
		this.loading = true;
		this.organizationService
			.getClinicalRequests({
				search: this.search.trim() || undefined,
				date: this.date || undefined,
				page: this.page,
				limit: this.limit,
			})
			.subscribe({
				next: (response) => {
					this.requests = response.data;
					this.total = response.total;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading clinical requests', error);
					this.loading = false;
				},
			});
	}

	onSearch(): void {
		this.page = 1;
		this.loadRequests();
	}

	onDateChange(): void {
		this.page = 1;
		this.loadRequests();
	}

	getInitials(name: string): string {
		if (!name) return 'UN';
		const parts = name.split(' ');
		if (parts.length >= 2) {
			return (parts[0][0] + parts[1][0]).toUpperCase();
		}
		return parts[0].substring(0, 2).toUpperCase();
	}

	statusLabel(status: string): string {
		switch (status) {
			case 'PENDING_PAYMENT':
				return 'Pendiente';
			case 'CONFIRMED':
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'Procesando';
			case 'COMPLETED':
				return 'Completado';
			default:
				return 'Pendiente';
		}
	}

	statusClass(status: string): string {
		switch (status) {
			case 'PENDING_PAYMENT':
				return 'bg-amber-50 text-amber-600 border-amber-100';
			case 'CONFIRMED':
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'bg-indigo-50 text-indigo-600 border-indigo-100';
			case 'COMPLETED':
				return 'bg-emerald-50 text-emerald-600 border-emerald-100';
			default:
				return 'bg-amber-50 text-amber-600 border-amber-100';
		}
	}

	get pendingCount(): number {
		return this.requests.filter((r) => r.status !== 'COMPLETED').length;
	}

	openDetailModal(item: any): void {
		this.selectedRequestDetail = item;
		this.isDetailModalVisible = true;
	}

	closeDetailModal(): void {
		this.isDetailModalVisible = false;
		this.selectedRequestDetail = null;
	}

	openCreateModal(): void {
		this.isModalVisible = true;
		this.selectedMode = 'SINGLE';
		this.selectedPatientId = '';
		this.selectedPatientIds = {};
		this.selectedPackageId = '';
		this.modalErrorMessage = '';
		this.modalSuccessMessage = '';
		this.loadPatientsAndPackages();
	}

	closeModal(): void {
		this.isModalVisible = false;
	}

	loadPatientsAndPackages(): void {
		this.organizationService.getPatients({ limit: 100 }).subscribe({
			next: (res) => {
				this.patientsList = res.data || [];
			},
			error: (err) => {
				console.error('Error loading patients', err);
			}
		});

		this.servicePackageService.getPackages().subscribe({
			next: (pkgs) => {
				this.packagesList = pkgs.filter(p => p.status === 'ACTIVE');
			},
			error: (err) => {
				console.error('Error loading packages', err);
			}
		});
	}

	togglePatientSelection(patientId: string): void {
		this.selectedPatientIds[patientId] = !this.selectedPatientIds[patientId];
	}

	submitRequest(): void {
		this.modalErrorMessage = '';
		this.modalSuccessMessage = '';

		let patientIds: string[] = [];
		if (this.selectedMode === 'SINGLE') {
			if (!this.selectedPatientId) {
				this.modalErrorMessage = 'Debe seleccionar un paciente.';
				return;
			}
			patientIds = [this.selectedPatientId];
		} else {
			patientIds = Object.keys(this.selectedPatientIds).filter(id => this.selectedPatientIds[id]);
			if (patientIds.length === 0) {
				this.modalErrorMessage = 'Debe seleccionar al menos un paciente para el lote.';
				return;
			}
		}

		if (!this.selectedPackageId) {
			this.modalErrorMessage = 'Debe seleccionar un paquete de servicios.';
			return;
		}

		this.submitting = true;
		this.organizationService.createClinicalRequests({
			patientIds,
			packageId: this.selectedPackageId
		}).subscribe({
			next: (res) => {
				this.submitting = false;
				this.modalSuccessMessage = 'Solicitud(es) creada(s) de manera exitosa.';
				this.loadRequests();
				setTimeout(() => {
					this.closeModal();
				}, 2000);
			},
			error: (err) => {
				this.submitting = false;
				this.modalErrorMessage = err?.error?.message || 'Error al crear la solicitud clínica. Intente de nuevo.';
			}
		});
	}
}
