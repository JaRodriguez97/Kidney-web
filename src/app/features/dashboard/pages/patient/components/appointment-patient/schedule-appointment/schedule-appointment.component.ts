import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentBookingStateService } from '@app/core/services/appointment-booking-state.service';
import {
	BackendServiceItem,
	ServiceCatalogService,
	ServiceFilters,
} from '@app/core/services/service-catalog.service';

type SpecialtyKey =
	| 'medicina-general'
	| 'cardiologia'
	| 'nutricion'
	| 'laboratorio-clinico'
	| 'nefrologia'
	| 'fisioterapia';

interface SpecialtyConfig {
	label: string;
	filters: ServiceFilters;
}

const SPECIALTY_CONFIG: Record<SpecialtyKey, SpecialtyConfig> = {
	'medicina-general': {
		label: 'Medicina General',
		filters: {
			cupsPrefixes: ['89'],
		},
	},
	cardiologia: {
		label: 'Cardiología',
		filters: { cupsPrefixes: ['89'], search: 'cardio' },
	},
	nutricion: {
		label: 'Nutrición',
		filters: { cupsPrefixes: ['99'], search: 'nutri' },
	},
	'laboratorio-clinico': {
		label: 'Laboratorio Clínico',
		filters: { cupsPrefixes: ['90', '91'] },
	},
	nefrologia: {
		label: 'Nefrología',
		filters: { cupsPrefixes: ['89'], search: 'nefro' },
	},
	fisioterapia: {
		label: 'Fisioterapia',
		filters: { cupsPrefixes: ['93'] },
	},
};

@Component({
	selector: 'app-schedule-appointment',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './schedule-appointment.component.html',
	styleUrl: './schedule-appointment.component.scss',
})
export class ScheduleAppointmentComponent {
	private readonly serviceCatalogService = inject(ServiceCatalogService);
	private readonly router = inject(Router);
	private readonly route = inject(ActivatedRoute);
	private readonly appointmentBookingState = inject(
		AppointmentBookingStateService,
	);

	selectedSpecialty: SpecialtyKey | null = null;
	services: BackendServiceItem[] = [];
	selectedServiceId = '';
	selectedService: BackendServiceItem | null = null;
	isLoadingServices = false;
	servicesError: string | null = null;
	private pendingServiceId: string | null = null;

	get selectedSpecialtyLabel(): string {
		if (!this.selectedSpecialty) {
			return 'Ninguna';
		}

		return SPECIALTY_CONFIG[this.selectedSpecialty].label;
	}

	get canContinue(): boolean {
		return !!this.selectedSpecialty && !!this.selectedService;
	}

	ngOnInit(): void {
		const snapshot = this.appointmentBookingState.getSnapshot();
		const specialtyFromQuery =
			this.route.snapshot.queryParamMap.get('specialty');
		const serviceIdFromQuery =
			this.route.snapshot.queryParamMap.get('serviceId');

		const persistedSpecialty = snapshot.specialty;
		const specialtyCandidate = specialtyFromQuery ?? persistedSpecialty;

		if (this.isSpecialtyKey(specialtyCandidate)) {
			this.selectedSpecialty = specialtyCandidate;
			this.pendingServiceId = serviceIdFromQuery ?? snapshot.serviceId;
			this.loadServicesBySpecialty(specialtyCandidate);
		}
	}

	selectSpecialty(specialty: SpecialtyKey): void {
		this.selectedSpecialty = specialty;
		this.resetServiceSelection();
		this.loadServicesBySpecialty(specialty);
	}

	onServiceSelectionChange(serviceId: string): void {
		this.selectedServiceId = serviceId;
		this.selectedService =
			this.services.find((service) => service.id === serviceId) || null;
	}

	cancelProcess(): void {
		this.router.navigate(['/dashboard/patient/appointments']);
	}

	goToNextStep(): void {
		if (!this.canContinue || !this.selectedSpecialty || !this.selectedService) {
			return;
		}

		this.appointmentBookingState.setServiceSelection({
			specialty: this.selectedSpecialty,
			serviceId: this.selectedService.id,
			serviceCode: this.selectedService.code,
			serviceName: this.selectedService.name,
		});

		this.router.navigate(
			['/dashboard/patient/appointments/schedule/select-provider'],
			{
				queryParams: {
					specialty: this.selectedSpecialty,
					serviceId: this.selectedService.id,
					serviceCode: this.selectedService.code,
					serviceName: this.selectedService.name,
				},
			},
		);
	}

	private loadServicesBySpecialty(specialty: SpecialtyKey): void {
		const { filters } = SPECIALTY_CONFIG[specialty];

		this.isLoadingServices = true;
		this.servicesError = null;

		this.serviceCatalogService.getServices(filters).subscribe({
			next: (items) => {
				this.services = items;

				if (this.pendingServiceId) {
					const persistedService =
						items.find((service) => service.id === this.pendingServiceId) ??
						null;
					if (persistedService) {
						this.selectedServiceId = persistedService.id;
						this.selectedService = persistedService;
					}
					this.pendingServiceId = null;
				}

				this.isLoadingServices = false;
			},
			error: () => {
				this.services = [];
				this.isLoadingServices = false;
				this.servicesError =
					'No fue posible cargar los servicios de la especialidad seleccionada.';
			},
		});
	}

	private resetServiceSelection(): void {
		this.services = [];
		this.selectedServiceId = '';
		this.selectedService = null;
		this.servicesError = null;
		this.pendingServiceId = null;
	}

	private isSpecialtyKey(value: string | null): value is SpecialtyKey {
		if (!value) {
			return false;
		}

		return value in SPECIALTY_CONFIG;
	}
}
