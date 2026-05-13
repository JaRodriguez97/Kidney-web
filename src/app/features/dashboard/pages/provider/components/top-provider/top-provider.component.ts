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

	private applyUser(user: User): void {
		this.user = user;
		this.initials = this.getInitials(user.firstName, user.lastName);
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
		if (url.includes('/appointments')) {
			return {
				title: 'Agenda de Citas',
				subtitle: 'Gestion de turnos y disponibilidad diaria',
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
