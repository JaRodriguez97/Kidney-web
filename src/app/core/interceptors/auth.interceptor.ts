import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { PlatformService } from '@app/shared/services/platform.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformService = inject(PlatformService);
  const router = inject(Router);
  const token = platformService.getLocalStorageItem('accessToken');

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: token,
      },
    });
  } else {
    console.warn('[AuthInterceptor] No hay token disponible');
  }

  return next(req).pipe(
    catchError((error: any) => {
      if (error?.status === 401) {
        router.navigate(['/login/patient']);
      }
      return throwError(() => error);
    }),
  );
};
