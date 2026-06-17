import { Component, inject } from '@angular/core';
import {
	OrganizationDashboardEmployee,
	OrganizationDashboardLabRequest,
	OrganizationDashboardResponse,
	OrganizationService,
} from '@app/core/services/organization.service';
import { AuthService } from '@app/features/auth/services/auth.service';
import { DatePipe, CurrencyPipe, NgClass } from '@angular/common';

@Component({
	selector: 'app-organization-dashboard',
	standalone: true,
	imports: [DatePipe, CurrencyPipe, NgClass],
	templateUrl: './organization-dashboard.component.html',
	styleUrl: './organization-dashboard.component.scss',
})
export class OrganizationDashboardComponent {
	private readonly organizationService = inject(OrganizationService);
	private readonly authService = inject(AuthService);

	loading = true;
	errorMessage: string | null = null;
	search = '';

	dashboard: OrganizationDashboardResponse | null = null;

	ngOnInit(): void {
		this.loadDashboard();
	}

	get organizationName(): string {
		return this.dashboard?.organization.legalName || 'Aliado Kidney Medicine';
	}

	get organizationStatus(): string {
		return this.dashboard?.organization.status || 'ACTIVE';
	}

	get totalEmployees(): number {
		return this.dashboard?.summary.totalEmployees ?? 0;
	}

	get pendingClinicalRequests(): number {
		return this.dashboard?.summary.pendingClinicalRequests ?? 0;
	}

	get pendingInvoices(): number {
		return this.dashboard?.summary.pendingInvoices ?? 0;
	}

	get recentEmployees(): OrganizationDashboardEmployee[] {
		return this.dashboard?.recentEmployees ?? [];
	}

	get labRequests(): OrganizationDashboardLabRequest[] {
		return this.dashboard?.labRequests ?? [];
	}

	get pendingAmount(): number {
		return this.dashboard?.billing.pendingAmount ?? 0;
	}

	get lastPaidAmount(): number {
		return this.dashboard?.billing.lastPaidAmount ?? 0;
	}

	get lastPaidAt(): string | null {
		return this.dashboard?.billing.lastPaidAt ?? null;
	}

	onSearchInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		this.search = target.value;
	}

	searchEmployees(): void {
		this.loadDashboard(this.search);
	}

	refresh(): void {
		this.loadDashboard(this.search);
	}

	logout(): void {
		this.authService.clearSession();
	}

	statusLabel(status: string): string {
		switch (status) {
			case 'PENDING_PAYMENT':
			case 'CONFIRMED':
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'Proceso';
			case 'COMPLETED':
				return 'Listo';
			default:
				return 'Pendiente';
		}
	}

	statusClass(status: string): string {
		switch (status) {
			case 'PENDING_PAYMENT':
			case 'CONFIRMED':
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'bg-blue-50 text-blue-600 border-blue-100';
			case 'COMPLETED':
				return 'bg-emerald-50 text-emerald-600 border-emerald-100';
			default:
				return 'bg-slate-100 text-slate-600 border-slate-200';
		}
	}

	private loadDashboard(search?: string): void {
		this.loading = true;
		this.errorMessage = null;

		this.organizationService
			.getDashboard({ search: search?.trim() || undefined, limit: 6 })
			.subscribe({
				next: (data) => {
					this.dashboard = data;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading organization dashboard', error);
					this.errorMessage =
						'No fue posible cargar el dashboard. Intente nuevamente.';
					this.loading = false;
				},
			});
	}
}
