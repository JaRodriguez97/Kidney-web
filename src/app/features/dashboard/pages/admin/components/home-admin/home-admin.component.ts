import { Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '@app/core/services/user.service';
import { CommonModule } from '@angular/common';
import {
	AppointmentService,
	GetProviderAgendaResponse,
	ProviderAgendaItem,
} from '@app/core/services/appointment.service';
import { ServiceCatalogService } from '@app/core/services/service-catalog.service';
import {
	EducationAdminService,
	GetAdminEducationDashboardResponse,
} from '@app/core/services/education-admin.service';
import {
	GetProviderLabsDashboardResponse,
	LabsDashboardService,
	ProviderLabDashboardRow,
} from '@app/core/services/labs-dashboard.service';
import { catchError, forkJoin, of } from 'rxjs';

interface HomeAppointmentRow {
	id: string;
	paciente: string;
	initials: string;
	initialsColor: string;
	servicio: string;
	hora: string;
	doctor: string;
	estado: {
		label: string;
		colorClass: string;
		borderClass: string;
		dotClass?: string;
		extraClass?: string;
	};
}

interface HomeArticleItem {
	id: string;
	title: string;
	subtitle: string;
	time: string;
	color: string;
}

@Component({
	selector: 'app-home-admin',
	standalone: true,
	imports: [RouterModule, DecimalPipe, CommonModule],
	templateUrl: './home-admin.component.html',
	styleUrl: './home-admin.component.scss',
})
export class HomeAdminComponent implements OnInit {
	private readonly userService = inject(UserService);
	private readonly appointmentService = inject(AppointmentService);
	private readonly serviceCatalogService = inject(ServiceCatalogService);
	private readonly educationAdminService = inject(EducationAdminService);
	private readonly labsDashboardService = inject(LabsDashboardService);

	articles: HomeArticleItem[] | null = null;
	totalUsers: number | null = null;
	percent = '%100';
	appointments: HomeAppointmentRow[] | null = null;

	activeServices: number | null = null;
	dayAppointmentsCount: number | null = null;
	dayCompletedPercent: number | null = null;
	labsPendingCount: number | null = null;
	resultsPendingCount: number | null = null;
	resultsByArea = {
		hematologia: 0,
		uroanalisis: 0,
		otros: 0,
	};

	ngOnInit(): void {
		const now = new Date();
		const todayDate = now.toISOString().slice(0, 10);
		const month = now.toISOString().slice(0, 7);

		forkJoin({
			users: this.userService.getUsers().pipe(catchError(() => of([]))),
			services: this.serviceCatalogService
				.getServices()
				.pipe(catchError(() => of([]))),
			appointments: this.appointmentService
				.getProviderAgenda(todayDate, undefined, month)
				.pipe(catchError(() => of(null))),
			labs: this.labsDashboardService
				.getProviderDashboard({ date: todayDate, month })
				.pipe(catchError(() => of(null))),
			education: this.educationAdminService
				.getAdminDashboard(5)
				.pipe(catchError(() => of(null))),
		}).subscribe(({ users, services, appointments, labs, education }) => {
			this.totalUsers = users.length;
			this.activeServices = services.filter(
				(service) => service.is_active,
			).length;

			this.applyAppointmentsData(appointments);
			this.applyLabsData(labs);
			this.applyEducationData(education);
		});
	}

	private applyAppointmentsData(
		appointments: GetProviderAgendaResponse | null,
	): void {
		if (!appointments) {
			this.appointments = [];
			this.dayAppointmentsCount = 0;
			this.dayCompletedPercent = 0;
			return;
		}

		const rows = [...appointments.appointments].sort((a, b) => {
			const left = new Date(a.startTime).getTime();
			const right = new Date(b.startTime).getTime();
			return left - right;
		});

		const completedCount = rows.filter(
			(row) => row.status === 'COMPLETED',
		).length;

		this.dayAppointmentsCount = rows.length;
		this.dayCompletedPercent = rows.length
			? Math.round((completedCount / rows.length) * 100)
			: 0;

		this.appointments = rows.slice(0, 6).map((row, index) => {
			const statusPresentation = this.mapAppointmentStatus(row.status);

			return {
				id: row.id,
				paciente: row.patientName,
				initials: this.getInitials(row.patientName),
				initialsColor: this.getInitialsClass(index),
				servicio: row.serviceName,
				hora: this.formatTime(row.startTime),
				doctor: row.providerName ?? 'Sin asignar',
				estado: statusPresentation,
			};
		});
	}

	private applyLabsData(labs: GetProviderLabsDashboardResponse | null): void {
		if (!labs) {
			this.labsPendingCount = 0;
			this.resultsPendingCount = 0;
			this.resultsByArea = { hematologia: 0, uroanalisis: 0, otros: 0 };
			return;
		}

		this.labsPendingCount = labs.stats.withoutValidation;

		const pendingResults = labs.rows.filter(
			(row) => row.status === 'SIN_VALIDAR' || row.status === 'TOMA',
		);
		this.resultsPendingCount = pendingResults.length;
		this.resultsByArea = this.buildResultsByArea(pendingResults);
	}

	private applyEducationData(
		education: GetAdminEducationDashboardResponse | null,
	): void {
		if (!education) {
			this.articles = [];
			return;
		}

		this.articles = education.recentArticles.map((article, index) => ({
			id: article.id,
			title: article.title,
			subtitle:
				article.authorName && article.authorName.length
					? `Publicado por ${article.authorName}`
					: 'Publicado',
			time: this.getRelativeTime(article.publishedAt ?? article.createdAt),
			color: index % 2 === 0 ? 'bg-primary' : 'bg-secondary',
		}));
	}

	private buildResultsByArea(rows: ProviderLabDashboardRow[]): {
		hematologia: number;
		uroanalisis: number;
		otros: number;
	} {
		return rows.reduce(
			(acc, row) => {
				const serviceName = row.serviceName.toLowerCase();

				if (serviceName.includes('hemat')) {
					acc.hematologia += 1;
					return acc;
				}

				if (serviceName.includes('uro')) {
					acc.uroanalisis += 1;
					return acc;
				}

				acc.otros += 1;
				return acc;
			},
			{
				hematologia: 0,
				uroanalisis: 0,
				otros: 0,
			},
		);
	}

	private mapAppointmentStatus(status: ProviderAgendaItem['status']): {
		label: string;
		colorClass: string;
		borderClass: string;
		dotClass?: string;
		extraClass?: string;
	} {
		switch (status) {
			case 'COMPLETED':
				return {
					label: 'Finalizada',
					colorClass: 'bg-slate-100 text-slate-600',
					borderClass: 'border-slate-200',
				};
			case 'CHECKED_IN':
			case 'IN_PROGRESS':
				return {
					label: 'En sala',
					colorClass: 'bg-amber-50 text-amber-700',
					borderClass: 'border-amber-100',
					dotClass: 'bg-amber-500 animate-pulse',
				};
			case 'CONFIRMED':
				return {
					label: 'Confirmada',
					colorClass: 'bg-blue-50 text-primary',
					borderClass: 'border-blue-100',
					dotClass: 'bg-primary',
				};
			case 'PENDING_PAYMENT':
				return {
					label: 'Pendiente',
					colorClass: 'bg-slate-100 text-slate-600',
					borderClass: 'border-slate-200',
				};
			case 'NO_SHOW':
				return {
					label: 'Ausente',
					colorClass: 'bg-purple-50 text-purple-700',
					borderClass: 'border-purple-100',
				};
			case 'RESCHEDULED':
				return {
					label: 'Reagendada',
					colorClass: 'bg-cyan-50 text-cyan-700',
					borderClass: 'border-cyan-100',
				};
			default:
				return {
					label: 'Cancelada',
					colorClass: 'bg-red-50 text-secondary',
					borderClass: 'border-red-100',
				};
		}
	}

	private getInitials(name: string): string {
		return name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((chunk) => chunk[0]?.toUpperCase() ?? '')
			.join('');
	}

	private getInitialsClass(index: number): string {
		const classes = [
			'bg-blue-100 text-blue-600',
			'bg-amber-100 text-amber-600',
			'bg-purple-100 text-purple-600',
			'bg-red-100 text-secondary',
			'bg-emerald-100 text-emerald-700',
			'bg-cyan-100 text-cyan-700',
		];

		return classes[index % classes.length] ?? classes[0];
	}

	private formatTime(isoDate: string): string {
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

	private getRelativeTime(isoDate: string): string {
		const createdAt = new Date(isoDate);
		const now = new Date();
		const diffMs = now.getTime() - createdAt.getTime();

		if (!Number.isFinite(diffMs)) {
			return 'Reciente';
		}

		const minuteMs = 60 * 1000;
		const hourMs = 60 * minuteMs;
		const dayMs = 24 * hourMs;

		if (diffMs < hourMs) {
			const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
			return `Hace ${minutes} min`;
		}

		if (diffMs < dayMs) {
			const hours = Math.max(1, Math.floor(diffMs / hourMs));
			return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
		}

		const days = Math.max(1, Math.floor(diffMs / dayMs));
		return `Hace ${days} día${days > 1 ? 's' : ''}`;
	}
}
