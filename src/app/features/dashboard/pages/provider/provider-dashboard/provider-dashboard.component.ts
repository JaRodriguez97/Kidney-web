import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { AsideProviderComponent } from '../components/aside-provider/aside-provider.component';
import { TopProviderComponent } from '../components/top-provider/top-provider.component';

@Component({
	selector: 'app-provider-dashboard',
	standalone: true,
	imports: [AsideProviderComponent, TopProviderComponent, RouterModule],
	templateUrl: './provider-dashboard.component.html',
	styleUrl: './provider-dashboard.component.scss',
})
export class ProviderDashboardComponent implements OnInit, OnDestroy {
	private readonly router = inject(Router);
	private readonly destroy$ = new Subject<void>();

	showTopProvider = true;

	ngOnInit(): void {
		this.updateTopProviderVisibility(this.router.url);

		this.router.events
			.pipe(
				filter(
					(event): event is NavigationEnd => event instanceof NavigationEnd,
				),
				takeUntil(this.destroy$),
			)
			.subscribe((event) => {
				this.updateTopProviderVisibility(event.urlAfterRedirects);
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private updateTopProviderVisibility(url: string): void {
		this.showTopProvider = !url.includes('/clinical-attention');
	}
}
