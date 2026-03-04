import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './features/dashboard/pages/admin/admin-dashboard/admin-dashboard.component';
import { ADMIN_DASHBOARD_ROUTES } from './features/dashboard/pages/admin/admin-dashboard/admin-dashboard.routes';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/pages/landing/landing.component').then(
        (m) => m.LandingComponent,
      ),
  },
  // route admin
  {
    path: 'admin',
    redirectTo: 'login/admin',
    pathMatch: 'full',
  },
  {
    path: 'login/:context',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'recovery-password',
    loadComponent: () =>
      import('./features/auth/pages/recovery-password/recovery-password.component').then(
        (m) => m.RecoveryPasswordComponent,
      ),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./features/blog/pages/blog-home/blog-home.component').then(
        (m) => m.BlogHomeComponent,
      ),
  },
  {
    path: 'blog/:id',
    loadComponent: () =>
      import('./features/blog/pages/blog-article/blog-article.component').then(
        (m) => m.BlogArticleComponent,
      ),
  },
  {
    path: 'blog/test/:id',
    loadComponent: () =>
      import('./features/blog/pages/blog-test/blog-test.component').then(
        (m) => m.BlogTestComponent,
      ),
  },

  //route register patient
  {
    path: 'register/patient',
    loadComponent: () =>
      import('./features/auth/pages/register-patient/register-patient.component').then(
        (m) => m.RegisterPatientComponent,
      ),
  },
  {
    path: 'dashboard',
    redirectTo: 'dashboard/admin',
    pathMatch: 'full',
  },
  {
    path: 'dashboard/patient',
    loadComponent: () =>
      import('./features/dashboard/pages/patient/patient-dashboard/patient-dashboard.component').then(
        (m) => m.PatientDashboardComponent,
      ),
    canActivate: [AuthGuard],
    data: { role: 'PATIENT' },
  },
  {
    path: 'dashboard/medical',
    loadComponent: () =>
      import('./features/dashboard/pages/medical/medical-dashboard/medical-dashboard.component').then(
        (m) => m.MedicalDashboardComponent,
      ),
    canActivate: [AuthGuard],
    data: { role: 'PROVIDER' },
  },
  {
    // route admin dashboard component
    path: 'dashboard/admin',
    canActivate: [AuthGuard],
    data: { role: 'ADMIN' },
    children: ADMIN_DASHBOARD_ROUTES,
  },
];
