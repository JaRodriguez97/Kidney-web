import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	PatientService,
	ProviderDashboardPatient,
	ProviderPatientRisk,
	ProviderPatientsResponse,
	PatientDocument,
} from '@app/core/services/patient.service';
import { AuthService } from '@app/features/auth/services/auth.service';
import { formatColombiaDate } from '@app/shared/utils/colombia-date.utils';

@Component({
	selector: 'app-patient-provider',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './patient-provider.component.html',
	styleUrl: './patient-provider.component.scss',
})
export class PatientProviderComponent implements OnInit {
	private readonly patientService = inject(PatientService);
	private readonly authService = inject(AuthService);

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

	// Receptionist Patient Modal
	isModalOpen = false;
	isEditing = false;
	savingPatient = false;
	modalError = '';
	selectedPatientId: string | null = null;

	patientForm = {
		email: '',
		password: '',
		firstName: '',
		lastName: '',
		middleName: '',
		secondLastName: '',
		documentType: 'CC',
		documentNumber: '',
		birthDate: '',
		phone: '',
		gender: 'MALE',
		address: '',
		neighborhood: '',
		commune: null as number | null,
		city: 'Cali',
		department: 'Valle del Cauca',
		bloodType: 'O+',
		allergies: '',
		chronicConditions: '',
		heightCm: null as number | null,
		weightKg: null as number | null,
		isMinor: false
	};

	// Receptionist Documents Modal
	isDocumentsModalOpen = false;
	selectedPatientName = '';
	documents: PatientDocument[] = [];
	documentsLoading = false;
	documentsError = '';

	get isReceptionist(): boolean {
		return this.authService.currentUser?.providerTypeCode === 'RECEPTIONIST';
	}

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
		return formatColombiaDate(dateInput);
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

	// Modal Actions
	openCreateModal(): void {
		this.isEditing = false;
		this.selectedPatientId = null;
		this.modalError = '';
		this.resetForm();
		this.isModalOpen = true;
	}

	openEditModal(patient: ProviderDashboardPatient): void {
		this.isEditing = true;
		this.selectedPatientId = patient.patientId;
		this.modalError = '';
		this.loading = true;

		this.patientService.getPatientById(patient.patientId).subscribe({
			next: (profile) => {
				this.populateForm(profile);
				this.isModalOpen = true;
				this.loading = false;
			},
			error: () => {
				this.modalError = 'No fue posible cargar el perfil del paciente.';
				this.loading = false;
			}
		});
	}

	closeModal(): void {
		this.isModalOpen = false;
	}

	resetForm(): void {
		this.patientForm = {
			email: '',
			password: '',
			firstName: '',
			lastName: '',
			middleName: '',
			secondLastName: '',
			documentType: 'CC',
			documentNumber: '',
			birthDate: '',
			phone: '',
			gender: 'MALE',
			address: '',
			neighborhood: '',
			commune: null,
			city: 'Cali',
			department: 'Valle del Cauca',
			bloodType: 'O+',
			allergies: '',
			chronicConditions: '',
			heightCm: null,
			weightKg: null,
			isMinor: false
		};
	}

	populateForm(profile: any): void {
		const pi = profile.personalInformation || {};
		const di = profile.demographicInformation || {};
		const ci = profile.contactInformation || {};
		const cs = profile.clinicalSummary || {};

		this.patientForm = {
			email: ci.email || '',
			password: '',
			firstName: pi.firstName || '',
			middleName: pi.middleName || '',
			lastName: pi.lastName || '',
			secondLastName: pi.secondLastName || '',
			documentType: pi.document?.type || 'CC',
			documentNumber: pi.document?.number || '',
			birthDate: pi.birthDate || '',
			phone: ci.mobile?.number || '',
			gender: pi.sex || 'MALE',
			address: di.address?.addressLine || '',
			neighborhood: di.address?.neighborhood || '',
			commune: di.address?.commune ? parseInt(di.address.commune, 10) : null,
			city: di.municipality?.name || 'Cali',
			department: di.department?.name || 'Valle del Cauca',
			bloodType: cs.bloodType || 'O+',
			allergies: cs.allergies || '',
			chronicConditions: cs.chronicConditions || '',
			heightCm: cs.heightCm || null,
			weightKg: cs.weightKg || null,
			isMinor: profile.isMinor || false
		};
	}

	savePatient(): void {
		if (this.savingPatient) return;
		this.savingPatient = true;
		this.modalError = '';

		if (this.isEditing && this.selectedPatientId) {
			const payload = {
				personalInformation: {
					firstName: this.patientForm.firstName,
					middleName: this.patientForm.middleName,
					lastName: this.patientForm.lastName,
					secondLastName: this.patientForm.secondLastName,
					sex: this.patientForm.gender,
					birthDate: this.patientForm.birthDate
				},
				demographicInformation: {
					department: { name: this.patientForm.department },
					municipality: { name: this.patientForm.city },
					address: {
						addressLine: this.patientForm.address,
						neighborhood: this.patientForm.neighborhood,
						commune: this.patientForm.commune ? String(this.patientForm.commune) : null
					}
				},
				contactInformation: {
					mobile: { number: this.patientForm.phone }
				}
			};

			this.patientService.updatePatient(this.selectedPatientId, payload).subscribe({
				next: () => {
					this.savingPatient = false;
					this.closeModal();
					this.loadPatients();
				},
				error: (err) => {
					this.savingPatient = false;
					this.modalError = err.error?.message || 'Error al actualizar paciente.';
				}
			});
		} else {
			// Create Patient
			const payload = {
				...this.patientForm,
				commune: this.patientForm.commune ?? undefined,
				heightCm: this.patientForm.heightCm ?? undefined,
				weightKg: this.patientForm.weightKg ?? undefined,
			};

			this.patientService.createPatient(payload).subscribe({
				next: () => {
					this.savingPatient = false;
					this.closeModal();
					this.loadPatients();
				},
				error: (err) => {
					this.savingPatient = false;
					this.modalError = err.error?.message || 'Error al registrar paciente.';
				}
			});
		}
	}

	// Documents Modal Actions
	openDocumentsModal(patient: ProviderDashboardPatient): void {
		this.selectedPatientName = patient.fullName;
		this.documents = [];
		this.documentsLoading = true;
		this.documentsError = '';
		this.isDocumentsModalOpen = true;

		this.patientService.getPatientDocuments(patient.patientId).subscribe({
			next: (docs) => {
				this.documents = docs;
				this.documentsLoading = false;
			},
			error: () => {
				this.documentsError = 'No fue posible cargar la lista de documentos.';
				this.documentsLoading = false;
			}
		});
	}

	closeDocumentsModal(): void {
		this.isDocumentsModalOpen = false;
	}

	shareDocument(doc: PatientDocument): void {
		// Mock sharing document: Copying details/link to clipboard
		const shareText = `Documento compartido: ${doc.title} (${doc.type}) - Emitido por: ${doc.issuer}`;
		navigator.clipboard.writeText(shareText).then(() => {
			alert(`Enlace de descarga del documento "${doc.title}" copiado al portapapeles.`);
		}).catch(() => {
			alert('No fue posible compartir el documento.');
		});
	}
}
