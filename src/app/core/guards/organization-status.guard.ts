import { Injectable, inject } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { OrganizationService } from '../services/organization.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * Guard that protects organization dashboard routes.
 *
 * Logic:
 *  - If the user's stored status is ACTIVE → allow access.
 *  - If the user's stored status is SUBMITTED | UNDER_REVIEW | PENDING →
 *    redirect to the "pending-approval" holding page.
 *  - On any error (network, 401, etc.) → redirect to "pending-approval"
 *    as a safe fallback so the app never loops.
 *
 * The guard also re-validates against the backend profile endpoint on each
 * activation so that a freshly-approved aliado doesn't need to log out and
 * back in to access the full dashboard.
 */
@Injectable({
  providedIn: 'root',
})
export class OrganizationStatusGuard implements CanActivate, CanActivateChild {
  private auth = inject(AuthService);
  private router = inject(Router);
  private organizationService = inject(OrganizationService);

  private readonly PENDING_STATUSES = new Set([
    'SUBMITTED',
    'UNDER_REVIEW',
    'PENDING',
  ]);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    return this.checkStatus(state.url);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> {
    return this.checkStatus(state.url);
  }

  private checkStatus(targetUrl: string): Observable<boolean | UrlTree> {
    // Fast-path: use the stored user status first to avoid an extra HTTP call
    const stored = this.auth.currentUser;
    if (stored?.status && !this.PENDING_STATUSES.has(stored.status)) {
      // Stored session says ACTIVE (or any non-pending status) → allow
      return of(true);
    }

    // Re-validate against the backend to pick up status changes without a re-login
    return this.organizationService.getProfile().pipe(
      map((profile: any) => {
        const status: string = profile?.status ?? profile?.data?.status ?? '';

        if (this.PENDING_STATUSES.has(status)) {
          return this.router.createUrlTree(['organization', 'pending-approval']);
        }

        // Update stored user so the fast-path works on subsequent navigations
        if (stored && stored.status !== status) {
          this.auth.setSession({
            accessToken:
              localStorage.getItem('accessToken') ?? '',
            user: { ...stored, status },
          });
        }

        return true;
      }),
      catchError(() => {
        // On error, redirect to pending page as a safe fallback (avoids loops)
        return of(this.router.createUrlTree(['organization', 'pending-approval']));
      }),
    );
  }
}
