import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
	AppointmentService,
	PatientAppointment,
} from '@app/core/services/appointment.service';

@Component({
	selector: 'app-appointment-patient',
	standalone: true,
	imports: [CommonModule, FullCalendarModule],
	templateUrl: './appointment-patient.component.html',
	styleUrl: './appointment-patient.component.scss',
})
export class AppointmentPatientComponent implements OnInit {
	view: 'upcoming' | 'past' = 'upcoming';
	loading = true;
	upcomingAppointments: PatientAppointment[] = [];
	pastAppointments: PatientAppointment[] = [];

	calendarOptions: CalendarOptions = {
		plugins: [dayGridPlugin, interactionPlugin],
		initialView: 'dayGridMonth',
		locale: esLocale,
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: '',
		},
		height: 'auto',
		editable: false,
		selectable: false,
		dayMaxEvents: true,
		events: [],
	};

	private static readonly PAST_STATUSES: PatientAppointment['status'][] = [
		'COMPLETED',
		'CANCELLED',
		'NO_SHOW',
		'RESCHEDULED',
	];

	private static readonly STATUS_CALENDAR_COLORS: Record<string, string> = {
		CONFIRMED: '#0ea5e9',
		PENDING_PAYMENT: '#f59e0b',
		CHECKED_IN: '#0ea5e9',
		IN_PROGRESS: '#8b5cf6',
		COMPLETED: '#22c55e',
		CANCELLED: '#ef4444',
		NO_SHOW: '#94a3b8',
		RESCHEDULED: '#94a3b8',
	};

	constructor(
		private router: Router,
		private appointmentService: AppointmentService,
	) {}

	ngOnInit(): void {
		this.loadAppointments();
	}

	get upcomingCount(): number {
		return this.upcomingAppointments.length;
	}

	get completedCount(): number {
		return this.pastAppointments.filter((a) => a.status === 'COMPLETED').length;
	}

	get cancelledCount(): number {
		return this.pastAppointments.filter((a) => a.status === 'CANCELLED').length;
	}

	setView(view: 'upcoming' | 'past') {
		this.view = view;
	}

	goToSchedule() {
		this.router.navigate(['/dashboard/patient/appointments/schedule']);
	}

	getBarColor(status: PatientAppointment['status']): string {
		const map: Record<string, string> = {
			CONFIRMED: 'bg-sky-500',
			PENDING_PAYMENT: 'bg-amber-400',
			CHECKED_IN: 'bg-sky-500',
			IN_PROGRESS: 'bg-purple-500',
			COMPLETED: 'bg-green-500',
			CANCELLED: 'bg-red-500',
			NO_SHOW: 'bg-slate-400',
			RESCHEDULED: 'bg-slate-400',
		};
		return map[status] ?? 'bg-slate-400';
	}

	getBadgeClasses(status: PatientAppointment['status']): string {
		const map: Record<string, string> = {
			CONFIRMED: 'bg-green-100 text-green-700',
			PENDING_PAYMENT: 'bg-amber-100 text-amber-700',
			CHECKED_IN: 'bg-sky-100 text-sky-700',
			IN_PROGRESS: 'bg-purple-100 text-purple-700',
			COMPLETED: 'bg-green-100 text-green-700',
			CANCELLED: 'bg-red-100 text-red-700',
			NO_SHOW: 'bg-slate-100 text-slate-500',
			RESCHEDULED: 'bg-slate-100 text-slate-500',
		};
		return map[status] ?? 'bg-slate-100 text-slate-500';
	}

	getDotColor(status: PatientAppointment['status']): string {
		const map: Record<string, string> = {
			CONFIRMED: 'bg-green-500',
			PENDING_PAYMENT: 'bg-amber-500',
			CHECKED_IN: 'bg-sky-500',
			IN_PROGRESS: 'bg-purple-500',
			COMPLETED: 'bg-green-500',
			CANCELLED: 'bg-red-500',
			NO_SHOW: 'bg-slate-400',
			RESCHEDULED: 'bg-slate-400',
		};
		return map[status] ?? 'bg-slate-400';
	}

	getStatusLabel(status: PatientAppointment['status']): string {
		const map: Record<string, string> = {
			CONFIRMED: 'Confirmada',
			PENDING_PAYMENT: 'Pendiente Confirmación',
			CHECKED_IN: 'En Espera',
			IN_PROGRESS: 'En Progreso',
			COMPLETED: 'Finalizada',
			CANCELLED: 'Cancelada',
			NO_SHOW: 'Ausente',
			RESCHEDULED: 'Reagendada',
		};
		return map[status] ?? status;
	}

	getModalityIcon(modality: string | null): string {
		if (!modality) return 'apartment';
		const lower = modality.toLowerCase();
		if (lower.includes('tele') || lower.includes('virtual')) return 'videocam';
		return 'apartment';
	}

	getModalityLabel(modality: string | null): string {
		if (!modality) return 'Presencial';
		const lower = modality.toLowerCase();
		if (lower.includes('tele') || lower.includes('virtual'))
			return 'Telemedicina';
		return 'Presencial';
	}

	getModalityBadgeClasses(modality: string | null): string {
		if (
			modality &&
			(modality.toLowerCase().includes('tele') ||
				modality.toLowerCase().includes('virtual'))
		) {
			return 'bg-sky-100 text-sky-700';
		}
		return 'bg-purple-100 text-purple-700';
	}

	getMonth(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleString('es', { month: 'short' });
	}

	getDay(dateStr: string): string {
		const date = new Date(dateStr);
		return String(date.getUTCDate()).padStart(2, '0');
	}

	getTime(timeStr: string): string {
		const date = new Date(timeStr);
		return date.toLocaleTimeString('es', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false,
		});
	}

	private loadAppointments(): void {
		this.loading = true;
		this.appointmentService.getMyAppointments().subscribe({
			next: (res) => {
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				this.upcomingAppointments = res.appointments
					.filter((a) => {
						const appointmentDate = new Date(a.scheduledDate);
						appointmentDate.setHours(0, 0, 0, 0);
						return (
							appointmentDate >= today &&
							!AppointmentPatientComponent.PAST_STATUSES.includes(a.status)
						);
					})
					.sort(
						(a, b) =>
							new Date(a.scheduledDate).getTime() -
							new Date(b.scheduledDate).getTime(),
					);

				this.pastAppointments = res.appointments
					.filter((a) => {
						const appointmentDate = new Date(a.scheduledDate);
						appointmentDate.setHours(0, 0, 0, 0);
						return (
							appointmentDate < today ||
							AppointmentPatientComponent.PAST_STATUSES.includes(a.status)
						);
					})
					.sort(
						(a, b) =>
							new Date(b.scheduledDate).getTime() -
							new Date(a.scheduledDate).getTime(),
					);

				this.updateCalendarEvents();
				this.loading = false;
			},
			error: () => {
				this.upcomingAppointments = [];
				this.pastAppointments = [];
				this.loading = false;
			},
		});
	}

	private updateCalendarEvents(): void {
		const allAppointments = [
			...this.upcomingAppointments,
			...this.pastAppointments,
		];
		this.calendarOptions = {
			...this.calendarOptions,
			events: allAppointments.map((a) => ({
				title: a.serviceName,
				date: a.scheduledDate.split('T')[0],
				color:
					AppointmentPatientComponent.STATUS_CALENDAR_COLORS[a.status] ??
					'#94a3b8',
			})),
		};
	}
}
