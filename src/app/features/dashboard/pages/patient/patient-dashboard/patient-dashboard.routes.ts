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
import { ConfirmAppointmentComponent } from '../components/appointment-patient/confirm-appointment/confirm-appointment.component';
import { PaymentGatewayComponent } from '../components/appointment-patient/payment-gateway/payment-gateway.component';
import { PaymentResultComponent } from '../components/appointment-patient/payment-result/payment-result.component';

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
			{
				path: 'appointments/schedule/confirm-appointment',
				component: ConfirmAppointmentComponent,
			},
			{
				path: 'appointments/schedule/payment-gateway',
				component: PaymentGatewayComponent,
			},
			{
				path: 'appointments/schedule/payment-result',
				component: PaymentResultComponent,
			},
			{ path: 'clinical-record', component: ClinicalRecordPatientComponent },
			{ path: 'documents', component: DocumentsPatientComponent },
			{ path: 'profile', component: ProfilePatientComponent },
			{ path: 'results', component: ResultsPatientComponent },
			{ path: 'support', component: SupportPatientComponent },
		],
	},
];
