import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextComponent } from '@app/shared/components/form/input-text/input-text.component';
import { ServiceEditModalComponent } from './components/service-edit-modal/service-edit-modal.component';
import { ServiceProviderTypesComponent } from './components/service-provider-types/service-provider-types.component';
import { Service } from '@app/domains/service-catalog/service.entity';

@Component({
	selector: 'app-services-admin',
	standalone: true,
	imports: [
		CommonModule,
		InputTextComponent,
		ServiceEditModalComponent,
		ServiceProviderTypesComponent,
	],
	templateUrl: './services-admin.component.html',
	styleUrl: './services-admin.component.scss',
})
export class ServicesAdminComponent {
	modelEditHidden: boolean = true;

	services: Service[] = [
		{
			name: 'Consulta Médica General',
			subtitle: 'Valoración integral',
			code: 'GEN-001',
			serviceType: 'MEDICAL_CONSULTATION',
			price: 180000,
			status: 'Activo',
		},
		{
			name: 'Panel Metabólico Completo',
			subtitle: 'Análisis sanguíneo',
			code: 'LAB-102',
			serviceType: 'LABORATORY',
			price: 150000,
			status: 'Activo',
		},
		{
			name: 'Perfil Lipídico Avanzado',
			code: 'LAB-205',
			serviceType: 'LABORATORY',
			price: 95000,
			status: 'Activo',
		},
		{
			name: 'Examen de Hemoglobina Glicosilada',
			code: 'LAB-310',
			serviceType: 'LABORATORY',
			price: 45000,
			status: 'Inactivo',
		},
		{
			name: 'Electrocardiograma de Reposo',
			code: 'CAR-110',
			serviceType: 'IMAGING',
			price: 90000,
			status: 'Activo',
		},
	];

	sortColumn: string = '';
	sortAscending: boolean = true;

	sort(column: string) {
		if (this.sortColumn === column) {
			this.sortAscending = !this.sortAscending;
		} else {
			this.sortColumn = column;
			this.sortAscending = true;
		}

		this.services.sort((a: any, b: any) => {
			const va: any = a[column];
			const vb: any = b[column];
			if (typeof va === 'string' && typeof vb === 'string') {
				return va.localeCompare(vb);
			}
			if (typeof va === 'number' && typeof vb === 'number') {
				return va - vb;
			}
			return 0;
		});

		if (!this.sortAscending) {
			this.services.reverse();
		}
	}
}
