import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { PlatformService } from '@app/shared/services/platform.service';
import { SidebarService } from '@app/shared/services/sidebar.service';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
	selector: 'app-aside-admin',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './aside-admin.component.html',
	styleUrl: './aside-admin.component.scss',
})
export class AsideAdminComponent implements OnInit, OnDestroy {
	private router = inject(Router);
	private platformService = inject(PlatformService);
	private sidebarService = inject(SidebarService);
	private readonly STORAGE_KEY = 'adminSidebarActive';
	private destroy$ = new Subject<void>();
	activeIndex: number = 0;
	isSidebarVisible$ = this.sidebarService.visible$;

	private routes = [
		'home',
		'services',
		'users',
		'articles',
		'appointments',
		'labs',
		'results',
		'settings',
		'support',
	];

	constructor() {}

	ngOnInit(): void {
		this.setActiveByUrl();

		// Escuchar cambios de ruta y actualizar el índice activo
		this.router.events
			.pipe(
				filter((event) => event instanceof NavigationEnd),
				takeUntil(this.destroy$),
			)
			.subscribe(() => {
				this.setActiveByUrl();
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private setActiveByUrl(): void {
		const urlSegments = this.router.url.split('/');
		const lastSegment = urlSegments[urlSegments.length - 1];

		const index = this.routes.indexOf(lastSegment);
		if (index !== -1) {
			this.activeIndex = index;
			this.platformService.setLocalStorageItem(
				this.STORAGE_KEY,
				index.toString(),
			);
		}
	}

	setActive(index: number): void {
		this.activeIndex = index;
		this.platformService.setLocalStorageItem(
			this.STORAGE_KEY,
			index.toString(),
		);
		const route = this.routes[index];
		if (route !== '' || index === 0) {
			this.router.navigate(['dashboard/admin/' + route]);
		}
	}
}
