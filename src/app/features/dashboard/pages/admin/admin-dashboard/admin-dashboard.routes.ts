import { Routes } from '@angular/router';
import { HomeAdminComponent } from '../components/home-admin/home-admin.component';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AppointmentAdminComponent } from '../components/appointment-admin/appointment-admin.component';
import { ArticlesAdminComponent } from '../components/articles-admin/articles-admin.component';
import { UsersAdminComponent } from '../components/users-admin/users-admin.component';
import { ServicesAdminComponent } from '../components/services-admin/services-admin.component';
import { LabsAdminComponent } from '../components/labs-admin/labs-admin.component';
import { ResultsAdminComponent } from '../components/results-admin/results-admin.component';
import { SettingsAdminComponent } from '../components/settings-admin/settings-admin.component';
import { SupportAdminComponent } from '../components/support-admin/support-admin.component';

export const ADMIN_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomeAdminComponent }, // ruta por defecto
      { path: 'appointments', component: AppointmentAdminComponent },
      { path: 'articles', component: ArticlesAdminComponent },
      { path: 'users', component: UsersAdminComponent },
      { path: 'services', component: ServicesAdminComponent },
      { path: 'labs', component: LabsAdminComponent },
      { path: 'results', component: ResultsAdminComponent },
      { path: 'settings', component: SettingsAdminComponent },
      { path: 'support', component: SupportAdminComponent },
    ],
  },
];
