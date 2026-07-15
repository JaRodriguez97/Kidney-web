import { Routes } from '@angular/router';
import { OrganizationDashboardComponent } from './organization-dashboard/organization-dashboard.component';
import { HomeOrganizationComponent } from './components/home-organization/home-organization.component';
import { ProfileOrganizationComponent } from './components/profile-organization/profile-organization.component';
import { UpgradeOrganizationComponent } from './components/upgrade-organization/upgrade-organization.component';
import { PatientsOrganizationComponent } from './components/patients-organization/patients-organization.component';
import { ClinicalRequestsOrganizationComponent } from './components/clinical-requests-organization/clinical-requests-organization.component';
import { ResultsOrganizationComponent } from './components/results-organization/results-organization.component';
import { PaymentsOrganizationComponent } from './components/payments-organization/payments-organization.component';
import { PendingApprovalComponent } from './components/pending-approval/pending-approval.component';
import { OrganizationStatusGuard } from '@app/core/guards/organization-status.guard';

export const ORGANIZATION_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: OrganizationDashboardComponent,
    children: [
      // Root: redirect to the conditional landing route
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // ── Holding page ──────────────────────────────────────────────────────
      // Accessible without the status guard so pending aliados don't loop.
      { path: 'pending-approval', component: PendingApprovalComponent },

      // ── Protected routes ──────────────────────────────────────────────────
      // OrganizationStatusGuard re-validates the org status on each activation.
      // If SUBMITTED | UNDER_REVIEW | PENDING → redirect to pending-approval.
      {
        path: 'home',
        component: HomeOrganizationComponent,
        canActivate: [OrganizationStatusGuard],
      },
      {
        path: 'profile',
        component: ProfileOrganizationComponent,
        canActivate: [OrganizationStatusGuard],
      },
      {
        path: 'upgrade',
        component: UpgradeOrganizationComponent,
        canActivate: [OrganizationStatusGuard],
      },
      {
        path: 'patients',
        component: PatientsOrganizationComponent,
        canActivate: [OrganizationStatusGuard],
      },
      {
        path: 'clinical-requests',
        component: ClinicalRequestsOrganizationComponent,
        canActivate: [OrganizationStatusGuard],
      },
      {
        path: 'results',
        component: ResultsOrganizationComponent,
        canActivate: [OrganizationStatusGuard],
      },
      {
        path: 'payments',
        component: PaymentsOrganizationComponent,
        canActivate: [OrganizationStatusGuard],
      },
    ],
  },
];
