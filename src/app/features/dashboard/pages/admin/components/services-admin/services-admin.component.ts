import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextComponent } from '@app/shared/components/form/input-text/input-text.component';
import { ServiceEditModalComponent } from './components/service-edit-modal/service-edit-modal.component';
import { ServiceProviderTypesComponent } from './components/service-provider-types/service-provider-types.component';
import { Service } from '@app/domains/service-catalog/service.entity';
import {
	ImportCupsResult,
	ServiceCatalogService,
} from '@app/core/services/service-catalog.service';
import { finalize } from 'rxjs';

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
export class ServicesAdminComponent implements OnInit {
	private readonly serviceCatalogService = inject(ServiceCatalogService);

	modelEditHidden: boolean = true;
	isUploading = false;
	uploadError: string | null = null;
	uploadResult: ImportCupsResult | null = null;

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

	ngOnInit(): void {
		this.loadServices();
	}

	loadServices(): void {
		this.serviceCatalogService.getServices().subscribe({
			next: (items) => {
				this.services = items.map((item) => ({
					id: item.id,
					name: item.name,
					subtitle: item.description || undefined,
					code: item.code,
					serviceType: item.service_type,
					price: 0,
					description: item.description || undefined,
					isActive: item.is_active,
					status: item.is_active ? 'Activo' : 'Inactivo',
				}));
			},
			error: (error) => {
				console.error('Error cargando servicios', error);
			},
		});
	}

	onCupsFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) {
			return;
		}

		this.uploadError = null;
		this.uploadResult = null;
		this.isUploading = true;

		this.serviceCatalogService
			.uploadCupsExcel(file)
			.pipe(
				finalize(() => {
					this.isUploading = false;
					input.value = '';
				}),
			)
			.subscribe({
				next: (result) => {
					this.uploadResult = result;
					this.loadServices();
				},
				error: (error) => {
					console.error('Error cargando archivo CUPS', error);
					this.uploadError =
						error?.error?.error ||
						error?.error?.message ||
						'No se pudo procesar el archivo CUPS';
				},
			});
	}

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
