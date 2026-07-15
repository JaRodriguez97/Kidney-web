import { Component, inject, OnInit } from '@angular/core';
import { OrganizationService } from '@app/core/services/organization.service';
import { AuthService } from '@app/features/auth/services/auth.service';
import { NgClass } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
	selector: 'app-organization-dashboard',
	standalone: true,
	imports: [NgClass, RouterOutlet, RouterLink, RouterLinkActive],
	templateUrl: './organization-dashboard.component.html',
	styleUrl: './organization-dashboard.component.scss',
})
export class OrganizationDashboardComponent implements OnInit {
	private readonly organizationService = inject(OrganizationService);
	private readonly authService = inject(AuthService);
	private readonly router = inject(Router);

	loading = true;
	isSuperAliado = false;
	legalName = '';

	ngOnInit(): void {
		this.loadDashboard();
		
		this.organizationService.refresh$.subscribe(() => {
			this.loadDashboard();
		});
	}

	get organizationName(): string {
		return this.legalName || 'Aliado Kidney Medicine';
	}

	logout(): void {
		this.authService.clearSession();
	}

	loadDashboard(): void {
		this.loading = true;
		this.organizationService.getDashboard({ limit: 1 }).subscribe({
			next: (data) => {
				this.isSuperAliado = data.organization.isSuperAliado;
				this.legalName = data.organization.legalName;
				this.loading = false;

				const currentUrl = this.router.url;
				if (!this.isSuperAliado) {
					if (!currentUrl.includes('profile') && !currentUrl.includes('upgrade')) {
						this.router.navigate(['/dashboard/organization/profile']);
					}
				} else {
					if (currentUrl.includes('profile-redirect') || currentUrl === '/dashboard/organization') {
						this.router.navigate(['/dashboard/organization/home']);
					}
				}
			},
			error: (error) => {
				console.error('Error loading organization details', error);
				this.loading = false;
			},
		});
	}
}
