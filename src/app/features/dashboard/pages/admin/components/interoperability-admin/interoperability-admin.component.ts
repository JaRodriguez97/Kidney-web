import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RdaViewerComponent } from '../rda-viewer/rda-viewer.component';

type InteropModule = {
	id: 'rda' | 'rips' | 'rca' | 'audit';
	title: string;
	description: string;
	icon: string;
	status: 'ready' | 'coming-soon';
	badge: string;
};

@Component({
	selector: 'app-interoperability-admin',
	standalone: true,
	imports: [CommonModule, RdaViewerComponent],
	templateUrl: './interoperability-admin.component.html',
	styleUrl: './interoperability-admin.component.scss',
})
export class InteroperabilityAdminComponent {
	readonly modules: InteropModule[] = [
		{
			id: 'rda',
			title: 'RDA - Consulta Externa',
			description:
				'Gestiona consulta, validacion y retransmision de Bundle FHIR R4 para MinSalud.',
			icon: 'clinical_notes',
			status: 'ready',
			badge: 'Activo',
		},
		{
			id: 'rips',
			title: 'RIPS JSON',
			description:
				'Consolida y prepara estructuras de envio para facturacion y reporte interoperable.',
			icon: 'data_object',
			status: 'coming-soon',
			badge: 'Proximamente',
		},
		{
			id: 'rca',
			title: 'RCA',
			description:
				'Centraliza componentes clinicos administrativos y estandares asociados.',
			icon: 'summarize',
			status: 'coming-soon',
			badge: 'Proximamente',
		},
		{
			id: 'audit',
			title: 'Auditoria de Transmisiones',
			description:
				'Visualiza trazabilidad de estados, respuestas de API y eventos de interoperabilidad.',
			icon: 'verified',
			status: 'coming-soon',
			badge: 'Proximamente',
		},
	];

	activeModule: InteropModule['id'] = 'rda';

	selectModule(moduleId: InteropModule['id']): void {
		const module = this.modules.find((item) => item.id === moduleId);
		if (!module || module.status !== 'ready') {
			return;
		}
		this.activeModule = moduleId;
	}

	isReady(moduleId: InteropModule['id']): boolean {
		const module = this.modules.find((item) => item.id === moduleId);
		return module?.status === 'ready';
	}
}
