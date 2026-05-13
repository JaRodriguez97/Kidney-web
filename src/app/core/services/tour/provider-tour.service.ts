import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Shepherd from 'shepherd.js';

const TOUR_KEY = 'kinexa_tour_provider_done';

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
export class ProviderTourService {
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
				title: '¡Bienvenido a tu Panel de Proveedor!',
				text: 'Este es un recorrido <strong>general</strong> del panel. Las secciones que ves dependen de tu tipo de proveedor y de los permisos asignados por el administrador. Algunas opciones pueden no estar disponibles según tu perfil.',
				buttons: [
					{ text: 'Ver recorrido', action: () => tour.next() },
					{ text: 'Saltar', action: () => tour.cancel(), secondary: true },
				],
			},
			{
				id: 'header',
				attachTo: { element: '#tour-top-provider', on: 'bottom' },
				title: 'Encabezado del panel',
				text: 'Muestra tu nombre, especialidad y sede clínica. El botón <strong>?</strong> relanza este recorrido cuando lo necesites.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'sidebar',
				attachTo: { element: '#tour-aside-provider', on: 'right' },
				title: 'Tu menú de navegación',
				text: 'Desde aquí accedes a las secciones habilitadas para tu tipo de proveedor. Si alguna sección no aparece o no es accesible, contáctate con el administrador de la plataforma.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-home',
				attachTo: { element: '#tour-nav-home-provider', on: 'right' },
				title: 'Dashboard',
				text: 'Tu página principal: muestra un resumen de tu actividad, próximas citas del día y métricas clave de tu práctica clínica.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-patients-clinical',
				attachTo: { element: '#tour-nav-patients-provider', on: 'right' },
				title: 'Pacientes e Historia Clínica',
				text: '<strong>Mis Pacientes</strong> lista los pacientes bajo tu cuidado. <strong>Historia Clínica</strong> te permite revisar registros de atención previos. Estas secciones pueden estar limitadas según tu tipo de proveedor.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-agenda-labs',
				attachTo: { element: '#tour-nav-agenda-provider', on: 'right' },
				title: 'Agenda y Laboratorios',
				text: '<strong>Agenda Médica</strong> muestra tus citas programadas y te permite gestionar tu disponibilidad. <strong>Laboratorios</strong> (si está habilitado) te permite programar y revisar exámenes de tus pacientes.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-support',
				attachTo: { element: '#tour-nav-support-provider', on: 'right' },
				title: 'Soporte',
				text: 'Si encuentras algún inconveniente o necesitas ayuda, desde aquí puedes enviar un ticket de soporte al equipo de administración.',
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
