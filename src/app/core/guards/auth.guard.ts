import { Injectable, inject } from '@angular/core';
import {
	CanActivate,
	CanActivateChild,
	Router,
	ActivatedRouteSnapshot,
	RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { PlatformService } from '@app/shared/services/platform.service';

@Injectable({
	providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
	private auth = inject(AuthService);
	private router = inject(Router);
	private platformService = inject(PlatformService);

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		if (!this.auth.isAuthenticated()) {
			this.router.navigate(['/login/patient']);
			return false;
		}

		const requiredRole = route.data?.['role'];
		const user = this.auth.currentUser;

		const stored = this.platformService.getLocalStorageItem('currentUser');
		const currentUser = user ?? (stored ? JSON.parse(stored) : null);

		if (requiredRole && currentUser) {
			const hasRequiredRole = currentUser.roles?.includes(requiredRole);

			if (!hasRequiredRole) {
				this.router.navigate(['/login/patient']);
				return false;
			}
		} else if (requiredRole && !currentUser) {
			this.router.navigate(['/login/patient']);
			return false;
		}

		return true;
	}

	canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		return this.canActivate(route, state);
	}
}
