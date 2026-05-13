import {
	Component,
	EventEmitter,
	OnDestroy,
	OnInit,
	Output,
	inject,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '@app/features/auth/services/auth.service';
import { UserService } from '@app/core/services/user.service';
import { SidebarService } from '@app/shared/services/sidebar.service';
import { User } from '@app/domains/user/user.entity';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
	selector: 'app-top-admin',
	standalone: true,
	imports: [TitleCasePipe],
	templateUrl: './top-admin.component.html',
	styleUrl: './top-admin.component.scss',
})
export class TopAdminComponent implements OnInit, OnDestroy {
	private readonly router = inject(Router);
	private readonly destroy$ = new Subject<void>();

	@Output() helpClicked = new EventEmitter<void>();

	user: User | null = null;
	initials = '';
	photoUrl: string | null = null;
	sectionTitle = 'Dashboard Principal';
	sectionSubtitle = 'Resumen de actividad y gestion clinica';

	constructor(
		private authService: AuthService,
		private userService: UserService,
		private sidebarService: SidebarService,
	) {}

	toggleSidebar(): void {
		this.sidebarService.toggle();
	}

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
			return 'Usuario';
		}

		return (
			[this.user.firstName, this.user.lastName].filter(Boolean).join(' ') ||
			'Usuario'
		);
	}

	get primaryRole(): string {
		if (!this.user?.roles?.length) {
			return 'Usuario';
		}

		return this.user.roles[0];
	}

	getInitials(firstName?: string, lastName?: string): string {
		const first = firstName ? firstName.charAt(0).toUpperCase() : '';
		const last = lastName ? lastName.charAt(0).toUpperCase() : '';
		return first + last || 'U';
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
				title: 'Gestion de Citas',
				subtitle: 'Control y seguimiento de agenda institucional',
			};
		}

		if (url.includes('/articles')) {
			return {
				title: 'Contenido Educativo',
				subtitle: 'Publicacion y administracion de articulos',
			};
		}

		if (url.includes('/users')) {
			return {
				title: 'Usuarios y Roles',
				subtitle: 'Administracion de accesos y perfiles',
			};
		}

		if (url.includes('/services')) {
			return {
				title: 'Catalogo de Servicios',
				subtitle: 'Configuracion de servicios clinicos y comerciales',
			};
		}

		if (url.includes('/labs')) {
			return {
				title: 'Laboratorio',
				subtitle: 'Monitoreo de ordenes y resultados de laboratorio',
			};
		}

		if (url.includes('/results')) {
			return {
				title: 'Resultados',
				subtitle: 'Panel de indicadores y metricas clinicas',
			};
		}

		if (url.includes('/forms')) {
			return {
				title: 'Motor de Formularios',
				subtitle: 'Gestion de plantillas y versiones activas',
			};
		}

		if (url.includes('/settings')) {
			return {
				title: 'Configuracion',
				subtitle: 'Parametros globales de la plataforma',
			};
		}

		if (url.includes('/support')) {
			return {
				title: 'Soporte',
				subtitle: 'Tickets e incidencias operativas',
			};
		}

		return {
			title: 'Dashboard Principal',
			subtitle: 'Resumen de actividad y gestion clinica',
		};
	}
}
