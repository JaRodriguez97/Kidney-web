import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import {
	AppointmentService,
	PatientAppointment,
} from '@app/core/services/appointment.service';
import { TelemedicineService } from '@app/features/telemedicine/services/telemedicine.service';
import {
	formatColombiaDate,
	formatColombiaTime,
	getTodayColombiaDateKey,
	toColombiaDateKey,
} from '@app/shared/utils/colombia-date.utils';

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
	selectedRangeStart: string | null = null;
	selectedRangeEnd: string | null = null;
	joiningAppointmentId: string | null = null;
	joinErrorMessage: string | null = null;

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
		selectable: true,
		selectMirror: true,
		select: (arg) => this.onCalendarRangeSelect(arg),
		dateClick: (arg) => this.onCalendarDateClick(arg),
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
		private telemedicineService: TelemedicineService,
	) {}

	ngOnInit(): void {
		this.loadAppointments();
	}

	get upcomingCount(): number {
		return this.filteredUpcomingAppointments.length;
	}

	get completedCount(): number {
		return this.filteredPastAppointments.filter((a) => a.status === 'COMPLETED')
			.length;
	}

	get cancelledCount(): number {
		return this.filteredPastAppointments.filter((a) => a.status === 'CANCELLED')
			.length;
	}

	get filteredUpcomingAppointments(): PatientAppointment[] {
		if (!this.selectedRangeStart || !this.selectedRangeEnd) {
			return this.upcomingAppointments;
		}

		return this.upcomingAppointments.filter((appointment) =>
			this.isWithinSelectedRange(appointment.scheduledDate),
		);
	}

	get filteredPastAppointments(): PatientAppointment[] {
		if (!this.selectedRangeStart || !this.selectedRangeEnd) {
			return this.pastAppointments;
		}

		return this.pastAppointments.filter((appointment) =>
			this.isWithinSelectedRange(appointment.scheduledDate),
		);
	}

	setView(view: 'upcoming' | 'past') {
		this.view = view;
	}

	onCalendarDateClick(arg: DateClickArg): void {
		this.selectedRangeStart = arg.dateStr;
		this.selectedRangeEnd = arg.dateStr;
	}

	onCalendarRangeSelect(arg: DateSelectArg): void {
		this.selectedRangeStart = arg.startStr;
		this.selectedRangeEnd = this.getInclusiveRangeEnd(arg.endStr);
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

	getModalityIcon(appointment: PatientAppointment): string {
		if (appointment.isTelemedicine || appointment.careModalityCode === 'TELEMEDICINA') {
			return 'videocam';
		}
		return 'apartment';
	}

	getModalityLabel(appointment: PatientAppointment): string {
		if (appointment.isTelemedicine || appointment.careModalityCode === 'TELEMEDICINA') {
			return 'Telemedicina';
		}
		return appointment.careModality ?? 'Presencial';
	}

	getModalityBadgeClasses(appointment: PatientAppointment): string {
		if (appointment.isTelemedicine || appointment.careModalityCode === 'TELEMEDICINA') {
			return 'bg-sky-100 text-sky-700';
		}
		return 'bg-purple-100 text-purple-700';
	}

	canJoinTeleconsultation(appointment: PatientAppointment): boolean {
		return (
			(appointment.isTelemedicine ||
				appointment.careModalityCode === 'TELEMEDICINA') &&
			['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(appointment.status)
		);
	}

	joinTeleconsultation(appointment: PatientAppointment): void {
		if (!this.canJoinTeleconsultation(appointment) || this.joiningAppointmentId) {
			return;
		}

		this.joiningAppointmentId = appointment.id;
		this.joinErrorMessage = null;

		this.telemedicineService.joinByAppointment(appointment.id).subscribe({
			next: (response) => {
				this.joiningAppointmentId = null;
				this.router.navigate(['/telemedicina', response.sessionId], {
					queryParams: { token: response.accessToken },
				});
			},
			error: () => {
				this.joiningAppointmentId = null;
				this.joinErrorMessage =
					'No fue posible ingresar a la videollamada. Verifica que la cita esté confirmada.';
			},
		});
	}

	getMonth(dateStr: string): string {
		const formatted = formatColombiaDate(dateStr);
		if (formatted === '-') {
			return '--';
		}

		const [day, month] = formatted.split('/');
		if (!day || !month) {
			return '--';
		}

		const monthMap: Record<string, string> = {
			'01': 'ene',
			'02': 'feb',
			'03': 'mar',
			'04': 'abr',
			'05': 'may',
			'06': 'jun',
			'07': 'jul',
			'08': 'ago',
			'09': 'sep',
			'10': 'oct',
			'11': 'nov',
			'12': 'dic',
		};

		return monthMap[month] ?? '--';
	}

	getDay(dateStr: string): string {
		const formatted = formatColombiaDate(dateStr);
		if (formatted === '-') {
			return '--';
		}

		const [day] = formatted.split('/');
		return day ?? '--';
	}

	getTime(timeStr: string): string {
		const formatted = formatColombiaTime(timeStr);
		return formatted === '-' ? '--:--' : formatted;
	}

	private loadAppointments(): void {
		this.loading = true;
		this.appointmentService.getMyAppointments().subscribe({
			next: (res) => {
				const todayDateKey = getTodayColombiaDateKey();

				this.upcomingAppointments = res.appointments
					.filter((a) => {
						const appointmentDateKey = toColombiaDateKey(a.scheduledDate);
						return (
							appointmentDateKey >= todayDateKey &&
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
						const appointmentDateKey = toColombiaDateKey(a.scheduledDate);
						return (
							appointmentDateKey < todayDateKey ||
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

	private isWithinSelectedRange(rawScheduledDate: string): boolean {
		if (!this.selectedRangeStart || !this.selectedRangeEnd) {
			return true;
		}

		const dateKey = toColombiaDateKey(rawScheduledDate);
		return (
			dateKey >= this.selectedRangeStart && dateKey <= this.selectedRangeEnd
		);
	}

	private getInclusiveRangeEnd(exclusiveEnd: string): string {
		const endDate = new Date(`${exclusiveEnd}T00:00:00`);
		endDate.setDate(endDate.getDate() - 1);
		return toColombiaDateKey(endDate);
	}
}
