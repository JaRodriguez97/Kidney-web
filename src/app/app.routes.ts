import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './features/dashboard/pages/admin/admin-dashboard/admin-dashboard.component';
import { ADMIN_DASHBOARD_ROUTES } from './features/dashboard/pages/admin/admin-dashboard/admin-dashboard.routes';
import { AuthGuard } from './core/guards/auth.guard';
import { PATIENT_DASHBOARD_ROUTES } from './features/dashboard/pages/patient/patient-dashboard/patient-dashboard.routes';
import { PROVIDER_DASHBOARD_ROUTES } from './features/dashboard/pages/provider/provider-dashboard/provider-dashboard.routes';

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
		path: 'login',
		redirectTo: 'login/patient',
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
		// route admin dashboard component
		path: 'dashboard/admin',
		canActivate: [AuthGuard],
		data: { role: 'ADMIN' },
		children: ADMIN_DASHBOARD_ROUTES,
	},
	{
		path: 'dashboard/patient',
		canActivate: [AuthGuard],
		data: { role: 'PATIENT' },
		children: PATIENT_DASHBOARD_ROUTES,
	},
	{
		path: 'dashboard/provider',

		// canActivate: [AuthGuard],
		data: { role: 'PROVIDER' },
		children: PROVIDER_DASHBOARD_ROUTES,
	},
];
