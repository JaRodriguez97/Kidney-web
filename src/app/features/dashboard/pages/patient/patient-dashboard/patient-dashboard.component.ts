import { Component, OnInit } from '@angular/core';
import { AsidePatientComponent } from '../components/aside-patient/aside-patient.component';
import { TopPatientComponent } from '../components/top-patient/top-patient.component';
import { RouterModule } from '@angular/router';
import { PatientTourService } from '@app/core/services/tour/patient-tour.service';

@Component({
	selector: 'app-patient-dashboard',
	standalone: true,
	imports: [AsidePatientComponent, TopPatientComponent, RouterModule],
	templateUrl: './patient-dashboard.component.html',
	styleUrl: './patient-dashboard.component.scss',
})
export class PatientDashboardComponent implements OnInit {
	constructor(private patientTourService: PatientTourService) {}

	ngOnInit(): void {
		this.patientTourService.startIfFirstVisit();
	}

	onHelpClicked(): void {
		this.patientTourService.startTour();
	}
}
