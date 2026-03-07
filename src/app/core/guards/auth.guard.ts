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
      // redirect to patient login by default
      this.router.navigate(['/login/patient']);
      return false;
    }

    const requiredRole = route.data?.['role'];
    const user = (this.auth as any).currentUser$?.value || null;

    // try to read current user from localStorage as fallback
    const stored = this.platformService.getLocalStorageItem('currentUser');
    const currentUser = user ?? (stored ? JSON.parse(stored) : null);

    if (requiredRole && currentUser) {
      // Get first role from roles array (User.entity defines roles as array)
      const userRole = currentUser.roles?.[0];

      if (userRole !== requiredRole) {
        // Don't redirect to another protected route to avoid loops
        // Instead, redirect to login since they don't have permission
        this.router.navigate(['/login/patient']);
        return false;
      }
    } else if (requiredRole && !currentUser) {
      // No user found, redirect to login
      this.router.navigate(['/login/patient']);
      return false;
    }

    return true;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.canActivate(route, state);
  }
}
