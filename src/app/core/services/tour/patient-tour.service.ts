import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Shepherd from 'shepherd.js';

const TOUR_KEY = 'kinexa_tour_patient_done';

const BUTTON_NEXT = {
	text: 'Siguiente →',
	action() {
		(this as any).next();
	},
};
const BUTTON_BACK = {
	text: '← Atrás',
	action() {
		(this as any).back();
	},
	secondary: true,
};

@Injectable({ providedIn: 'root' })
export class PatientTourService {
	private readonly platformId = inject(PLATFORM_ID);

	startIfFirstVisit(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		if (!localStorage.getItem(TOUR_KEY)) {
			setTimeout(() => this.startTour(), 600);
		}
	}

	startTour(): void {
		if (!isPlatformBrowser(this.platformId)) return;

		const tour = new Shepherd.Tour({
			useModalOverlay: true,
			defaultStepOptions: {
				cancelIcon: { enabled: true },
				classes: 'shepherd-theme-arrows',
				scrollTo: { behavior: 'smooth', block: 'center' },
			},
		});

		tour.on('complete', () => localStorage.setItem(TOUR_KEY, '1'));
		tour.on('cancel', () => localStorage.setItem(TOUR_KEY, '1'));

		tour.addSteps([
			{
				id: 'welcome',
				title: '¡Bienvenido a tu Portal de Salud!',
				text: 'Te mostramos un recorrido rápido por tu espacio personal en Kidney Medicine. Puedes cancelarlo en cualquier momento y volver con el botón <strong>?</strong> del encabezado.',
				buttons: [
					{ text: 'Ver recorrido', action: () => tour.next() },
					{ text: 'Saltar', action: () => tour.cancel(), secondary: true },
				],
			},
			{
				id: 'header',
				attachTo: { element: '#tour-top-patient', on: 'bottom' },
				title: 'Tu encabezado personal',
				text: 'Aquí encontrarás tu nombre, la fecha de última actualización y el acceso a tu perfil. El botón <strong>?</strong> relanza este recorrido cuando lo necesites.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'privacy-badge',
				attachTo: { element: '#tour-privacy-badge', on: 'bottom' },
				title: 'Privacidad garantizada',
				text: 'Tu información médica está protegida. Solo tú y tu equipo médico autorizado pueden acceder a ella, en cumplimiento con las normas de protección de datos.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'sidebar',
				attachTo: { element: '#tour-aside-patient', on: 'right' },
				title: 'Tu menú de navegación',
				text: 'Desde aquí accedes a todas las secciones de tu portal de salud. Todo lo que necesitas está a un clic de distancia.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-home',
				attachTo: { element: '#tour-nav-home-patient', on: 'right' },
				title: 'Resumen',
				text: 'Tu página de inicio: muestra un resumen de tus próximas citas, alertas de salud y actividad reciente en tu historial.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-appointments',
				attachTo: { element: '#tour-nav-appointments-patient', on: 'right' },
				title: 'Citas',
				text: 'Agenda nuevas citas, consulta las programadas y revisa tu historial de consultas anteriores con los especialistas.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-clinical-record',
				attachTo: { element: '#tour-nav-clinical-record', on: 'right' },
				title: 'Historial Clínico',
				text: 'Accede a tu historial médico completo: diagnósticos, atenciones previas, impresiones clínicas y planes de tratamiento.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-results',
				attachTo: { element: '#tour-nav-results-patient', on: 'right' },
				title: 'Resultados de laboratorio',
				text: 'Consulta los resultados de tus exámenes de laboratorio publicados por el equipo médico, con la posibilidad de descargarlos.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-documents',
				attachTo: { element: '#tour-nav-documents', on: 'right' },
				title: 'Documentos',
				text: 'Accede a tus documentos médicos: incapacidades, certificados, órdenes e informes generados durante tus atenciones.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-profile-support',
				attachTo: { element: '#tour-nav-profile', on: 'right' },
				title: 'Perfil y Soporte',
				text: 'Actualiza tus datos personales y de contacto desde <strong>Perfil</strong>. Si necesitas ayuda, usa <strong>Soporte</strong> para enviar un ticket a nuestro equipo.',
				buttons: [
					BUTTON_BACK,
					{ text: 'Finalizar tour ✓', action: () => tour.complete() },
				],
			},
		]);

		tour.start();
	}

	resetTour(): void {
		if (!isPlatformBrowser(this.platformId)) return;
		localStorage.removeItem(TOUR_KEY);
	}
}
