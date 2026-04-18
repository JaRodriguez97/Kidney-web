import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
	AppointmentService,
	ProviderAgendaItem,
} from '@app/core/services/appointment.service';
import { AuthService } from '@app/features/auth/services/auth.service';

@Component({
	selector: 'app-home-provider',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './home-provider.component.html',
	styleUrl: './home-provider.component.scss',
})
export class HomeProviderComponent implements OnInit {
	private readonly appointmentService = inject(AppointmentService);
	private readonly authService = inject(AuthService);

	appointments: ProviderAgendaItem[] = [];
	loading = false;
	errorMessage = '';

	ngOnInit(): void {
		this.loadAgenda();
	}

	get attendedCount(): number {
		return this.appointments.filter((appointment) =>
			['COMPLETED'].includes(appointment.status),
		).length;
	}

	get pendingCount(): number {
		return this.appointments.filter((appointment) =>
			['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(
				appointment.status,
			),
		).length;
	}

	get currentOrNextAppointment(): ProviderAgendaItem | null {
		return (
			this.appointments.find((appointment) =>
				['CHECKED_IN', 'IN_PROGRESS', 'CONFIRMED', 'PENDING_PAYMENT'].includes(
					appointment.status,
				),
			) ?? null
		);
	}

	get canStartClinicalCare(): boolean {
		return (
			this.authService.hasPermission('clinical.create') ||
			this.authService.hasPermission('clinical.update')
		);
	}

	get canReadClinicalRecord(): boolean {
		return this.authService.hasPermission('clinical.read');
	}

	get canOrderLabs(): boolean {
		return (
			this.authService.hasPermission('labs.order') ||
			this.authService.hasPermission('clinical.assignLab')
		);
	}

	loadAgenda(): void {
		this.loading = true;
		this.errorMessage = '';

		this.appointmentService.getProviderAgenda().subscribe({
			next: (response) => {
				this.appointments = response.appointments;
				this.loading = false;
			},
			error: () => {
				this.errorMessage =
					'No fue posible cargar la agenda del provider en este momento.';
				this.loading = false;
			},
		});
	}

	trackByAppointment(_: number, appointment: ProviderAgendaItem): string {
		return appointment.id;
	}

	getInitials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((chunk) => chunk[0]?.toUpperCase() ?? '')
			.join('');
	}

	getStatusLabel(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'COMPLETED':
				return 'Atendido';
			case 'CHECKED_IN':
				return 'En Sala';
			case 'IN_PROGRESS':
				return 'En Atención';
			case 'CONFIRMED':
				return 'Confirmado';
			case 'PENDING_PAYMENT':
				return 'Pendiente';
			case 'NO_SHOW':
				return 'Ausente';
			case 'CANCELLED':
				return 'Cancelado';
			case 'RESCHEDULED':
				return 'Reagendado';
			default:
				return status;
		}
	}

	getRowClasses(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'bg-primary/5 border-l-4 border-l-primary group';
			case 'COMPLETED':
				return 'text-slate-400 bg-slate-50/10 hover:bg-slate-50/30 transition-colors';
			default:
				return 'hover:bg-white/50 transition-colors';
		}
	}

	getStatusClasses(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'COMPLETED':
				return 'text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-tighter';
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide';
			case 'NO_SHOW':
				return 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-secondary border border-red-100 uppercase tracking-wide';
			case 'CANCELLED':
				return 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide';
			default:
				return 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide';
		}
	}
}
