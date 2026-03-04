import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!this.auth.isAuthenticated()) {
      // redirect to patient login by default
      this.router.navigate(['/login/patient']);
      return false;
    }

    const requiredRole = route.data?.['role'];
    const user = (this.auth as any).currentUser$?.value || null;

    // try to read current user from localStorage as fallback
    const stored = localStorage.getItem('currentUser');
    const currentUser = user ?? (stored ? JSON.parse(stored) : null);

    if (requiredRole) {
      if (!currentUser || currentUser.role !== requiredRole) {
        // redirect to the dashboard matching the user's role
        if (!currentUser) {
          this.router.navigate(['/']);
        } else if (currentUser.role === 'ADMIN') {
          this.router.navigate(['/dashboard/admin']);
        } else if (currentUser.role === 'PROVIDER') {
          this.router.navigate(['/dashboard/medical']);
        } else {
          this.router.navigate(['/dashboard/patient']);
        }
        return false;
      }
    }

    return true;
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.canActivate(route, state);
  }
}
