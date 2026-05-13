import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Shepherd from 'shepherd.js';

const TOUR_KEY = 'kinexa_tour_admin_done';

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
export class AdminTourService {
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
				title: '¡Bienvenido al Panel de Administración!',
				text: 'Te haremos un recorrido rápido por las principales funciones disponibles. Puedes cancelarlo en cualquier momento y volver a iniciarlo con el botón <strong>?</strong> del encabezado.',
				buttons: [
					{ text: 'Empezar tour', action: () => tour.next() },
					{ text: 'Saltar', action: () => tour.cancel(), secondary: true },
				],
			},
			{
				id: 'header',
				attachTo: { element: '#tour-top-admin', on: 'bottom' },
				title: 'Encabezado del panel',
				text: 'Aquí verás el título de la sección activa, tu nombre, rol y el botón de menú para mostrar u ocultar la barra lateral. El botón <strong>?</strong> relanza este tour en cualquier momento.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'sidebar',
				attachTo: { element: '#tour-aside-admin', on: 'right' },
				title: 'Menú de navegación',
				text: 'Desde aquí accedes a todas las secciones del sistema. Puedes ocultarlo para ganar más espacio de trabajo.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-home',
				attachTo: { element: '#tour-nav-home-admin', on: 'right' },
				title: 'Dashboard',
				text: 'Vista general con métricas clave: citas del día, pacientes activos, resultados pendientes y estado general de la plataforma.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-services',
				attachTo: { element: '#tour-nav-services', on: 'right' },
				title: 'Servicios',
				text: 'Gestiona el catálogo de servicios médicos: crea, edita precios, activa o desactiva servicios y administra paquetes.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-users',
				attachTo: { element: '#tour-nav-users', on: 'right' },
				title: 'Usuarios',
				text: 'Administra usuarios de la plataforma: crea proveedores de servicio, asigna roles, configura tipos de proveedor y gestiona permisos.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-education',
				attachTo: { element: '#tour-nav-education', on: 'right' },
				title: 'Educación',
				text: 'Publica y gestiona artículos educativos para pacientes. Monitorea evaluaciones y certificados emitidos.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-appointments',
				attachTo: { element: '#tour-nav-appointments-admin', on: 'right' },
				title: 'Citas',
				text: 'Visualiza y gestiona todas las citas de la plataforma: confirma, reagenda o cancela citas de cualquier paciente o proveedor.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-labs',
				attachTo: { element: '#tour-nav-labs-admin', on: 'right' },
				title: 'Laboratorios',
				text: 'Administra el catálogo de laboratorios disponibles y supervisa las órdenes de exámenes generadas en la plataforma.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-results',
				attachTo: { element: '#tour-nav-results-admin', on: 'right' },
				title: 'Resultados',
				text: 'Revisa, valida y publica los resultados de laboratorio. Controla el flujo de validación antes de que el paciente los vea.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-forms',
				attachTo: { element: '#tour-nav-forms', on: 'right' },
				title: 'Formularios dinámicos',
				text: 'Crea y gestiona formularios clínicos personalizados que los proveedores usarán durante las atenciones médicas.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-settings',
				attachTo: { element: '#tour-nav-settings', on: 'right' },
				title: 'Configuraciones',
				text: 'Ajusta los parámetros globales de la plataforma: sede clínica, notificaciones, integraciones y más.',
				buttons: [BUTTON_BACK, BUTTON_NEXT],
			},
			{
				id: 'nav-support',
				attachTo: { element: '#tour-nav-support-admin', on: 'right' },
				title: 'Soporte y contacto',
				text: 'Gestiona los tickets de soporte de pacientes y proveedores, y monitorea la salud general de la plataforma.',
				buttons: [
					BUTTON_BACK,
					{
						text: 'Finalizar tour ✓',
						action: () => tour.complete(),
					},
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
