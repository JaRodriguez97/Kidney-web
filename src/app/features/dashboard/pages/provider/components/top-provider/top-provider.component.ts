import { TitleCasePipe } from '@angular/common';
import { User } from '@app/domains/user/user.entity';
import { UserService } from '@app/core/services/user.service';
import { AuthService } from '@app/features/auth/services/auth.service';
import {
	Component,
	EventEmitter,
	OnDestroy,
	OnInit,
	Output,
	inject,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
	selector: 'app-top-provider',
	standalone: true,
	imports: [TitleCasePipe],
	templateUrl: './top-provider.component.html',
	styleUrl: './top-provider.component.scss',
})
export class TopProviderComponent implements OnInit, OnDestroy {
	private readonly authService = inject(AuthService);
	private readonly userService = inject(UserService);
	private readonly router = inject(Router);
	private readonly destroy$ = new Subject<void>();

	@Output() helpClicked = new EventEmitter<void>();

	user: User | null = null;
	initials = '';
	sectionTitle = 'Panel del Proveedor';
	sectionSubtitle = 'Seguimiento de atencion y agenda medica';
	attentionContextLabel = '';
	isClinicalAttentionSection = false;
	isMedicalOrderSection = false;
	private clinicalAttentionQueryParams: Record<string, string> = {};

	ngOnInit(): void {
		this.updateSectionByUrl(this.router.url);

		this.router.events
			.pipe(
				filter(
					(event): event is NavigationEnd => event instanceof NavigationEnd,
				),
				takeUntil(this.destroy$),
			)
			.subscribe((event) => {
				this.updateSectionByUrl(event.urlAfterRedirects);
			});

		this.authService.currentUser$
			.pipe(takeUntil(this.destroy$))
			.subscribe((authUser) => {
				if (!authUser) {
					this.user = null;
					this.initials = '';
					return;
				}

				this.applyUser(authUser);
				this.userService
					.getCurrentUser()
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: (fullUser) => this.applyUser(fullUser),
						error: () => undefined,
					});
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	get userDisplayName(): string {
		if (!this.user) {
			return 'Proveedor';
		}

		return (
			[this.user.firstName, this.user.lastName].filter(Boolean).join(' ') ||
			'Proveedor'
		);
	}

	get providerTypeLabel(): string {
		if (this.user?.providerTypeName) {
			return this.user.providerTypeName;
		}

		if (this.user?.roles?.length) {
			return this.user.roles[0];
		}

		return 'Proveedor de Servicios';
	}

	getInitials(firstName?: string, lastName?: string): string {
		const first = firstName ? firstName.charAt(0).toUpperCase() : '';
		const last = lastName ? lastName.charAt(0).toUpperCase() : '';
		return first + last || 'P';
	}

	goBack(): void {
		if (this.isMedicalOrderSection && Object.keys(this.clinicalAttentionQueryParams).length) {
			void this.router.navigate(['/dashboard/provider/clinical-attention'], {
				queryParams: this.clinicalAttentionQueryParams,
			});
		} else {
			void this.router.navigate(['/dashboard/provider/appointments']);
		}
	}

	private applyUser(user: User): void {
		this.user = user;
		this.initials = this.getInitials(user.firstName, user.lastName);
	}

	private updateSectionByUrl(url: string): void {
		const urlTree = this.router.parseUrl(url);
		const queryParams = urlTree.queryParams;
		const historyState =
			typeof history !== 'undefined'
				? (history.state as { serviceName?: string } | null)
				: null;

		const section = this.getSectionDefinition(url);
		this.sectionTitle = section.title;
		this.sectionSubtitle = section.subtitle;
		this.isMedicalOrderSection = url.includes('/medical-order/');
		this.isClinicalAttentionSection =
			url.includes('/clinical-attention') || this.isMedicalOrderSection;

		if (!this.isClinicalAttentionSection) {
			this.attentionContextLabel = '';
			return;
		}

		const serviceNameFromQuery =
			typeof queryParams['serviceName'] === 'string'
				? queryParams['serviceName']
				: '';
		const serviceName = serviceNameFromQuery || historyState?.serviceName || '';
		const appointmentId =
			typeof queryParams['appointmentId'] === 'string'
				? queryParams['appointmentId']
				: '';

		if (this.isMedicalOrderSection) {
			// Guardar los queryParams para poder navegar de vuelta a clinical-attention
			this.clinicalAttentionQueryParams = {};
			for (const key of ['appointmentId', 'patientId', 'serviceId', 'serviceName']) {
				if (typeof queryParams[key] === 'string' && queryParams[key]) {
					this.clinicalAttentionQueryParams[key] = queryParams[key] as string;
				}
			}
		}

		const formattedAppointmentId = appointmentId
			? ` • Cita ${appointmentId.slice(0, 8)}`
			: '';

		this.attentionContextLabel = `${serviceName || 'Servicio no disponible'}${formattedAppointmentId}`;
	}

	private getSectionDefinition(url: string): {
		title: string;
		subtitle: string;
	} {
		if (url.includes('/appointments')) {
			return {
				title: 'Agenda de Citas',
				subtitle: 'Gestion de turnos y disponibilidad diaria',
			};
		}

		if (url.includes('/medical-order/')) {
			const orderTitleMap: Record<string, string> = {
				formula: 'Fórmula de Medicamentos',
				labs: 'Solicitud de Laboratorios',
				referral: 'Remisión e Interconsulta',
				incapacity: 'Certificado de Incapacidad',
			};
			const match = /\/medical-order\/([^/?]+)/.exec(url);
			const orderType = match ? match[1] : '';
			return {
				title: orderTitleMap[orderType] ?? 'Orden Médica',
				subtitle: 'Registro de orden médica para la consulta en curso',
			};
		}

		if (url.includes('/clinical-attention')) {
			return {
				title: 'Atencion Clinica',
				subtitle: 'Registro y evolucion de la consulta en curso',
			};
		}

		if (url.includes('/clinical-record')) {
			return {
				title: 'Historia Clinica',
				subtitle: 'Consulta de antecedentes y registros del paciente',
			};
		}

		if (url.includes('/labs')) {
			return {
				title: 'Laboratorio',
				subtitle: 'Solicitud y seguimiento de examenes',
			};
		}

		if (url.includes('/patients')) {
			return {
				title: 'Pacientes',
				subtitle: 'Listado y estado de pacientes asignados',
			};
		}

		if (url.includes('/support')) {
			return {
				title: 'Soporte',
				subtitle: 'Canales de ayuda y seguimiento de solicitudes',
			};
		}

		return {
			title: 'Panel del Proveedor',
			subtitle: 'Seguimiento de atencion y agenda medica',
		};
	}
}
