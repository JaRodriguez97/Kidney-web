import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-schedule-appointment',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './schedule-appointment.component.html',
	styleUrl: './schedule-appointment.component.scss',
})
export class ScheduleAppointmentComponent {
	selectedSpecialty: string | null = null;

	selectSpecialty(specialty: string): void {
		this.selectedSpecialty = specialty;
	}
}
