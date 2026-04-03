import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

@Component({
	selector: 'app-appointment-patient',
	standalone: true,
	imports: [CommonModule, FullCalendarModule],
	templateUrl: './appointment-patient.component.html',
	styleUrl: './appointment-patient.component.scss',
})
export class AppointmentPatientComponent {
	view: 'upcoming' | 'past' = 'upcoming';

	calendarOptions: CalendarOptions = {
		plugins: [dayGridPlugin, interactionPlugin],
		initialView: 'dayGridMonth',
		locale: esLocale,
		headerToolbar: {
			left: 'prev,next today',
			center: 'title',
			right: '',
		},
		height: 'auto',
		editable: false,
		selectable: false,
		dayMaxEvents: true,
		events: [
			{
				title: 'Consulta Medicina General',
				date: '2023-10-12',
				color: '#0ea5e9',
			},
			{
				title: 'Chequeo Nutricional',
				date: '2023-10-24',
				color: '#f59e0b',
			},
			{
				title: 'Evaluación Salud Integral',
				date: '2023-11-05',
				color: '#0ea5e9',
			},
			{
				title: 'Toma de muestras laboratorio',
				date: '2023-11-15',
				color: '#0ea5e9',
			},
			{
				title: 'Consulta Medicina General',
				date: '2023-09-28',
				color: '#22c55e',
			},
			{
				title: 'Toma de muestras laboratorio',
				date: '2023-09-15',
				color: '#22c55e',
			},
			{
				title: 'Chequeo Nutricional',
				date: '2023-08-30',
				color: '#94a3b8',
			},
		],
	};

	constructor(private router: Router) {}

	setView(view: 'upcoming' | 'past') {
		this.view = view;
	}

	goToSchedule() {
		this.router.navigate(['/dashboard/patient/appointments/schedule']);
	}
}
