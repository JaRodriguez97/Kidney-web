import { Routes } from '@angular/router';
import { HomePatientComponent } from '../components/home-patient/home-patient.component';
import { PatientDashboardComponent } from './patient-dashboard.component';
import { AppointmentPatientComponent } from '../components/appointment-patient/appointment-patient.component';
import { ClinicalRecordPatientComponent } from '../components/clinical-record-patient/clinical-record-patient.component';
import { DocumentsPatientComponent } from '../components/documents-patient/documents-patient.component';
import { ProfilePatientComponent } from '../components/profile-patient/profile-patient.component';
import { ResultsPatientComponent } from '../components/results-patient/results-patient.component';
import { SupportPatientComponent } from '../components/support-patient/support-patient.component';
import { ScheduleAppointmentComponent } from '../components/appointment-patient/schedule-appointment/schedule-appointment.component';
import { SelectProviderComponent } from '../components/appointment-patient/select-provider/select-provider.component';
import { SelectDatetimeComponent } from '../components/appointment-patient/select-datetime/select-datetime.component';

export const PATIENT_DASHBOARD_ROUTES: Routes = [
	{
		path: '',
		component: PatientDashboardComponent,
		children: [
			{ path: '', redirectTo: 'home', pathMatch: 'full' },
			{ path: 'home', component: HomePatientComponent },
			{ path: 'appointments', component: AppointmentPatientComponent },
			{
				path: 'appointments/schedule',
				component: ScheduleAppointmentComponent,
			},
			{
				path: 'appointments/schedule/select-provider',
				component: SelectProviderComponent,
			},
			{
				path: 'appointments/schedule/select-datetime',
				component: SelectDatetimeComponent,
			},
			{ path: 'clinical-record', component: ClinicalRecordPatientComponent },
			{ path: 'documents', component: DocumentsPatientComponent },
			{ path: 'profile', component: ProfilePatientComponent },
			{ path: 'results', component: ResultsPatientComponent },
			{ path: 'support', component: SupportPatientComponent },
		],
	},
];
