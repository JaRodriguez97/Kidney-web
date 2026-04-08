import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentBookingStateService } from '@app/core/services/appointment-booking-state.service';
import { ProviderService } from '@app/core/services/provider.service';
import { Provider } from '@app/domains/user/provider.entity';

@Component({
	selector: 'app-select-provider',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './select-provider.component.html',
	styleUrl: './select-provider.component.scss',
})
export class SelectProviderComponent implements OnInit {
	private readonly providerService = inject(ProviderService);
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly appointmentBookingState = inject(
		AppointmentBookingStateService,
	);

	providers: Provider[] = [];
	selectedProviderId: string | null = null;
	isLoadingProviders = false;
	providersError: string | null = null;

	searchTerm = '';
	genderFilter = 'all';
	ageFilter = 'all';
	experienceFilter = 'all';

	specialty: string | null = null;
	serviceId: string | null = null;
	serviceCode: string | null = null;
	serviceName: string | null = null;

	ngOnInit(): void {
		const snapshot = this.appointmentBookingState.getSnapshot();

		this.specialty =
			this.route.snapshot.queryParamMap.get('specialty') ?? snapshot.specialty;
		this.serviceId =
			this.route.snapshot.queryParamMap.get('serviceId') ?? snapshot.serviceId;
		this.serviceCode =
			this.route.snapshot.queryParamMap.get('serviceCode') ??
			snapshot.serviceCode;
		this.serviceName =
			this.route.snapshot.queryParamMap.get('serviceName') ??
			snapshot.serviceName;
		this.selectedProviderId =
			this.route.snapshot.queryParamMap.get('providerId') ??
			snapshot.providerId;

		this.loadProviders();
	}

	get filteredProviders(): Provider[] {
		const term = this.searchTerm.trim().toLowerCase();
		let filtered = this.providers;

		if (term) {
			filtered = filtered.filter((provider) =>
				this.getProviderFullName(provider).toLowerCase().includes(term),
			);
		}

		if (this.experienceFilter !== 'all') {
			filtered = filtered.filter((provider) => {
				const years = provider.profile.yearsOfExperience;
				if (years === null || years === undefined) {
					return false;
				}

				if (this.experienceFilter === '1-5') {
					return years >= 1 && years <= 5;
				}

				if (this.experienceFilter === '5-10') {
					return years > 5 && years <= 10;
				}

				if (this.experienceFilter === '10+') {
					return years > 10;
				}

				return true;
			});
		}

		return filtered;
	}

	get canContinue(): boolean {
		return !!this.selectedProviderId;
	}

	selectProvider(provider: Provider): void {
		this.selectedProviderId = provider.id;
		this.appointmentBookingState.setProviderSelection({
			providerId: provider.id,
			providerName: this.getProviderFullName(provider),
		});
	}

	goBack(): void {
		this.router.navigate(['/dashboard/patient/appointments/schedule'], {
			queryParams: {
				specialty: this.specialty ?? undefined,
				serviceId: this.serviceId ?? undefined,
				serviceCode: this.serviceCode ?? undefined,
				serviceName: this.serviceName ?? undefined,
			},
		});
	}

	goToNextStep(): void {
		if (!this.selectedProviderId) {
			return;
		}

		let selectedProviderName: string | null = null;

		const selectedProvider = this.providers.find(
			(provider) => provider.id === this.selectedProviderId,
		);

		if (selectedProvider) {
			selectedProviderName = this.getProviderFullName(selectedProvider);
			this.appointmentBookingState.setProviderSelection({
				providerId: selectedProvider.id,
				providerName: selectedProviderName,
			});
		}

		this.router.navigate(
			['/dashboard/patient/appointments/schedule/select-datetime'],
			{
				queryParams: {
					specialty: this.specialty ?? undefined,
					serviceId: this.serviceId ?? undefined,
					serviceCode: this.serviceCode ?? undefined,
					serviceName: this.serviceName ?? undefined,
					providerId: this.selectedProviderId,
					providerName: selectedProviderName ?? undefined,
				},
			},
		);
	}

	trackByProviderId(_: number, provider: Provider): string {
		return provider.id;
	}

	getProviderFullName(provider: Provider): string {
		const firstName = provider.user.firstName?.trim() ?? '';
		const lastName = provider.user.lastName?.trim() ?? '';
		const fullName = `${firstName} ${lastName}`.trim();

		if (fullName) {
			return fullName;
		}

		return provider.user.email;
	}

	getProviderDisplaySpecialty(provider: Provider): string {
		const primarySpecialty = provider.specialties.find(
			(specialty) => specialty.isPrimary,
		);

		return (
			primarySpecialty?.name ??
			provider.specialties[0]?.name ??
			provider.providerType.name ??
			provider.profile.professionalTitle ??
			'Profesional de la salud'
		);
	}

	getProviderAvatar(provider: Provider): string | null {
		return provider.profile.profilePhotoUrl;
	}

	getProviderInitials(provider: Provider): string {
		const name = this.getProviderFullName(provider);
		const initials = name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('');

		return initials || 'PR';
	}

	private loadProviders(): void {
		this.isLoadingProviders = true;
		this.providersError = null;

		this.providerService
			.getProviders({
				serviceId: this.serviceId,
				specialty: this.specialty,
			})
			.subscribe({
				next: (providers) => {
					this.providers = providers;
					if (
						this.selectedProviderId &&
						!providers.some(
							(provider) => provider.id === this.selectedProviderId,
						)
					) {
						this.selectedProviderId = null;
					}
					this.isLoadingProviders = false;
				},
				error: () => {
					this.providers = [];
					this.providersError =
						'No fue posible cargar la lista de profesionales en este momento.';
					this.isLoadingProviders = false;
				},
			});
	}
}
