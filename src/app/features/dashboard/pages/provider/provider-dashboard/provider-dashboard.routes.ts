import { Routes } from '@angular/router';
import { HomeProviderComponent } from '../components/home-provider/home-provider.component';
import { ProviderDashboardComponent } from './provider-dashboard.component';
import { AppointmentProviderComponent } from '../components/appointment-provider/appointment-provider.component';
import { ClinicalRecordProviderComponent } from '../components/clinical-record-provider/clinical-record-provider.component';
import { LabsProviderComponent } from '../components/labs-provider/labs-provider.component';
import { PatientProviderComponent } from '../components/patient-provider/patient-provider.component';
import { SupportProviderComponent } from '../components/support-provider/support-provider.component';

export const PROVIDER_DASHBOARD_ROUTES: Routes = [
	{
		path: '',
		component: ProviderDashboardComponent,
		children: [
			{ path: '', redirectTo: 'home', pathMatch: 'full' },
			{ path: 'home', component: HomeProviderComponent },
			{ path: 'appointments', component: AppointmentProviderComponent },
			{ path: 'clinical-record', component: ClinicalRecordProviderComponent },
			{ path: 'labs', component: LabsProviderComponent },
			{ path: 'patients', component: PatientProviderComponent },
			{ path: 'support', component: SupportProviderComponent },
		],
	},
];
