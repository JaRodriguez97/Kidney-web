import { Component } from '@angular/core';
import { AsidePatientComponent } from "../components/aside-patient/aside-patient.component";
import { TopPatientComponent } from "../components/top-patient/top-patient.component";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [AsidePatientComponent, TopPatientComponent, RouterModule],
  templateUrl: './patient-dashboard.component.html',
  styleUrl: './patient-dashboard.component.scss'
})
export class PatientDashboardComponent {

}
