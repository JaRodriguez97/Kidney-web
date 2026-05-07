import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	AppointmentService,
	ProviderAgendaItem,
} from '@app/core/services/appointment.service';

@Component({
	selector: 'app-appointment-admin',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './appointment-admin.component.html',
	styleUrl: './appointment-admin.component.scss',
})
export class AppointmentAdminComponent implements OnInit {
	private readonly appointmentService = inject(AppointmentService);

	loading = false;
	errorMessage = '';

	searchTerm = '';
	statusFilter: 'ALL' | ProviderAgendaItem['status'] = 'ALL';
	selectedDate = this.toDateKey(new Date());

	appointments: ProviderAgendaItem[] = [];

	ngOnInit(): void {
		this.loadAgenda();
	}

	get filteredAppointments(): ProviderAgendaItem[] {
		const normalizedSearch = this.searchTerm.trim().toLowerCase();

		return this.appointments.filter((row) => {
			const matchesStatus =
				this.statusFilter === 'ALL' || row.status === this.statusFilter;

			if (!matchesStatus) {
				return false;
			}

			if (!normalizedSearch.length) {
				return true;
			}

			const haystack = [
				row.patientName,
				row.providerName ?? '',
				row.serviceName,
			]
				.join(' ')
				.toLowerCase();

			return haystack.includes(normalizedSearch);
		});
	}

	get totalToday(): number {
		return this.filteredAppointments.length;
	}

	get pendingToday(): number {
		return this.filteredAppointments.filter((row) =>
			['PENDING_PAYMENT', 'CONFIRMED'].includes(row.status),
		).length;
	}

	get cancelledToday(): number {
		return this.filteredAppointments.filter((row) =>
			['CANCELLED', 'NO_SHOW', 'RESCHEDULED'].includes(row.status),
		).length;
	}

	onSearchChange(value: string): void {
		this.searchTerm = value;
	}

	onStatusChange(value: 'ALL' | ProviderAgendaItem['status']): void {
		this.statusFilter = value;
	}

	onDateChange(value: string): void {
		this.selectedDate = value;
		this.loadAgenda();
	}

	trackByRow(_: number, row: ProviderAgendaItem): string {
		return row.id;
	}

	getInitials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((chunk) => chunk[0]?.toUpperCase() ?? '')
			.join('');
	}

	getPatientReference(row: ProviderAgendaItem): string {
		return `ID: ${row.patientId.slice(0, 8)}...`;
	}

	formatDate(isoDate: string): string {
		const parsed = new Date(`${isoDate}T00:00:00`);
		if (Number.isNaN(parsed.getTime())) {
			return '--';
		}

		return parsed.toLocaleDateString('es-CO', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	}

	formatTime(isoDate: string): string {
		const parsed = new Date(isoDate);
		if (Number.isNaN(parsed.getTime())) {
			return '--:--';
		}

		return parsed.toLocaleTimeString('es-CO', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
		});
	}

	getStatusLabel(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'PENDING_PAYMENT':
				return 'PENDIENTE';
			case 'CONFIRMED':
				return 'CONFIRMADA';
			case 'CHECKED_IN':
				return 'EN SALA';
			case 'IN_PROGRESS':
				return 'EN CURSO';
			case 'COMPLETED':
				return 'FINALIZADA';
			case 'NO_SHOW':
				return 'AUSENTE';
			case 'RESCHEDULED':
				return 'REAGENDADA';
			default:
				return 'CANCELADA';
		}
	}

	getStatusClass(status: ProviderAgendaItem['status']): string {
		switch (status) {
			case 'PENDING_PAYMENT':
				return 'badge bg-amber-50 text-amber-700 border-amber-200';
			case 'CONFIRMED':
				return 'badge bg-green-50 text-green-700 border-green-200';
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return 'badge bg-blue-50 text-blue-700 border-blue-200';
			case 'COMPLETED':
				return 'badge bg-slate-100 text-slate-600 border-slate-200';
			case 'NO_SHOW':
				return 'badge bg-purple-50 text-purple-700 border-purple-200';
			case 'RESCHEDULED':
				return 'badge bg-cyan-50 text-cyan-700 border-cyan-200';
			default:
				return 'badge bg-red-50 text-red-700 border-red-200';
		}
	}

	private loadAgenda(): void {
		const month = this.selectedDate.slice(0, 7);

		this.loading = true;
		this.errorMessage = '';

		this.appointmentService
			.getProviderAgenda(this.selectedDate, undefined, month)
			.subscribe({
				next: (response) => {
					this.appointments = response.appointments;
					this.loading = false;
				},
				error: () => {
					this.errorMessage =
						'No fue posible cargar las citas del día en este momento.';
					this.appointments = [];
					this.loading = false;
				},
			});
	}

	private toDateKey(date: Date): string {
		return date.toISOString().slice(0, 10);
	}
}
