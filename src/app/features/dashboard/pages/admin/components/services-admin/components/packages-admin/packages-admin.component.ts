import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ServicePackage } from '@app/domains/service-catalog/service-package.entity';
import { ServicePackageService } from '@app/core/services/service-package.service';
import { CreatePackageModalComponent } from '@app/features/dashboard/pages/admin/components/services-admin/components/create-package-modal/create-package-modal.component';

@Component({
	selector: 'app-packages-admin',
	standalone: true,
	imports: [CommonModule, CreatePackageModalComponent],
	templateUrl: './packages-admin.component.html',
	styleUrl: './packages-admin.component.scss',
})
export class PackagesAdminComponent implements OnInit {
	private readonly servicePackageService = inject(ServicePackageService);

	packages: ServicePackage[] = [];
	isLoading = false;
	loadError: string | null = null;

	isModalVisible = false;
	editingPackageId: string | null = null;

	ngOnInit(): void {
		this.loadPackages();
	}

	getDefaultPrice(pkg: ServicePackage): number {
		const defaultPrice =
			pkg.prices.find((item) => item.isDefault) ?? pkg.prices[0];
		return defaultPrice?.amount || 0;
	}

	getItemsCount(pkg: ServicePackage): number {
		return pkg.items.reduce((total, item) => total + item.quantity, 0);
	}

	loadPackages(): void {
		this.isLoading = true;
		this.loadError = null;

		this.servicePackageService.getPackages().subscribe({
			next: (items) => {
				this.packages = items;
				this.isLoading = false;
			},
			error: (error) => {
				console.error('Error cargando paquetes', error);
				this.loadError =
					error?.error?.error ||
					error?.error?.message ||
					'No se pudieron cargar los paquetes';
				this.isLoading = false;
			},
		});
	}

	openCreateModal(): void {
		this.editingPackageId = null;
		this.isModalVisible = true;
	}

	openEditModal(pkg: ServicePackage): void {
		this.editingPackageId = pkg.id;
		this.isModalVisible = true;
	}

	onModalClose(): void {
		this.isModalVisible = false;
		this.editingPackageId = null;
	}

	onSaved(): void {
		this.onModalClose();
		this.loadPackages();
	}

	toggleStatus(pkg: ServicePackage): void {
		const nextStatus = pkg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
		this.servicePackageService
			.updateStatus(pkg.id, { status: nextStatus })
			.subscribe(() => this.loadPackages());
	}

	softDelete(pkg: ServicePackage): void {
		this.servicePackageService
			.updateStatus(pkg.id, { softDelete: true })
			.subscribe(() => this.loadPackages());
	}
}
