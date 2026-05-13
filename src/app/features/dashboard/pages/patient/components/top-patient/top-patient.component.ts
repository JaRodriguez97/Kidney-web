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
	selector: 'app-top-patient',
	standalone: true,
	imports: [],
	templateUrl: './top-patient.component.html',
	styleUrl: './top-patient.component.scss',
})
export class TopPatientComponent implements OnInit, OnDestroy {
	private readonly authService = inject(AuthService);
	private readonly userService = inject(UserService);
	private readonly router = inject(Router);
	private readonly destroy$ = new Subject<void>();

	@Output() helpClicked = new EventEmitter<void>();

	user: User | null = null;
	initials = '';
	sectionTitle = 'Panel del Paciente';
	sectionSubtitle = 'Consulta de servicios y seguimiento de tu atencion';

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
			return 'Paciente';
		}

		return (
			[this.user.firstName, this.user.lastName].filter(Boolean).join(' ') ||
			'Paciente'
		);
	}

	get documentLabel(): string {
		if (!this.user?.documentNumber) {
			return 'ID: --';
		}

		return `ID: ${this.user.documentNumber}`;
	}

	private applyUser(user: User): void {
		this.user = user;
		this.initials = this.getInitials(user.firstName, user.lastName);
	}

	private getInitials(firstName?: string, lastName?: string): string {
		const first = firstName ? firstName.charAt(0).toUpperCase() : '';
		const last = lastName ? lastName.charAt(0).toUpperCase() : '';
		return first + last || 'P';
	}

	private updateSectionByUrl(url: string): void {
		const section = this.getSectionDefinition(url);
		this.sectionTitle = section.title;
		this.sectionSubtitle = section.subtitle;
	}

	private getSectionDefinition(url: string): {
		title: string;
		subtitle: string;
	} {
		if (url.includes('/appointments/schedule/payment-gateway')) {
			return {
				title: 'Pasarela de Pago',
				subtitle: 'Finaliza el pago de tu servicio medico programado',
			};
		}

		if (url.includes('/appointments/schedule')) {
			return {
				title: 'Agendar Cita',
				subtitle: 'Completa los pasos para reservar tu atencion',
			};
		}

		if (url.includes('/appointments')) {
			return {
				title: 'Mis Citas',
				subtitle: 'Consulta y gestiona tus citas medicas',
			};
		}

		if (url.includes('/clinical-record')) {
			return {
				title: 'Historia Clinica',
				subtitle: 'Revisa antecedentes y registros de salud',
			};
		}

		if (url.includes('/documents')) {
			return {
				title: 'Documentos',
				subtitle: 'Accede a certificados y soportes clinicos',
			};
		}

		if (url.includes('/profile')) {
			return {
				title: 'Mi Perfil',
				subtitle: 'Actualiza tus datos personales y de contacto',
			};
		}

		if (url.includes('/results')) {
			return {
				title: 'Resultados',
				subtitle: 'Consulta examenes y reportes de laboratorio',
			};
		}

		if (url.includes('/support')) {
			return {
				title: 'Soporte',
				subtitle: 'Canales de ayuda y seguimiento de solicitudes',
			};
		}

		return {
			title: 'Panel del Paciente',
			subtitle: 'Consulta de servicios y seguimiento de tu atencion',
		};
	}
}
