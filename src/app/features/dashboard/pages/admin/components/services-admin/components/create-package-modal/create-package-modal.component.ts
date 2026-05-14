import { CommonModule } from '@angular/common';
import {
	Component,
	EventEmitter,
	Input,
	OnChanges,
	Output,
	SimpleChanges,
	inject,
} from '@angular/core';
import {
	FormArray,
	FormBuilder,
	FormGroup,
	ReactiveFormsModule,
	Validators,
} from '@angular/forms';
import {
	CreateServicePackageItemInput,
	ServicePackage,
} from '@app/domains/service-catalog/service-package.entity';
import { ServicePackageService } from '@app/core/services/service-package.service';
import {
	BackendServiceItem,
	ServiceCatalogService,
} from '@app/core/services/service-catalog.service';

interface SelectedServiceItem {
	serviceId: string;
	code: string;
	name: string;
	quantity: number;
	unitPrice: number;
}

@Component({
	selector: 'app-create-package-modal',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './create-package-modal.component.html',
	styleUrl: './create-package-modal.component.scss',
})
export class CreatePackageModalComponent implements OnChanges {
	@Input() visible = false;
	@Input() packageId: string | null = null;
	@Output() close = new EventEmitter<void>();
	@Output() saved = new EventEmitter<void>();

	private readonly fb = inject(FormBuilder);
	private readonly serviceCatalogService = inject(ServiceCatalogService);
	private readonly servicePackageService = inject(ServicePackageService);

	isLoadingServices = false;
	isSaving = false;
	loadError: string | null = null;
	private searchDebounceHandle: ReturnType<typeof setTimeout> | null = null;

	services: BackendServiceItem[] = [];
	search = '';
	finalPriceTouched = false;

	readonly form = this.fb.group({
		name: ['', [Validators.required, Validators.minLength(2)]],
		description: [''],
		packageCategoryId: [''],
		finalPrice: [0, [Validators.required, Validators.min(0)]],
	});

	readonly selectedItemsForm = this.fb.array([]);

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['visible']?.currentValue) {
			this.initializeModal();
		}
	}

	get selectedItems(): FormArray {
		return this.selectedItemsForm;
	}

	get selectedItemGroups(): FormGroup[] {
		return this.selectedItems.controls as FormGroup[];
	}

	get filteredServices(): BackendServiceItem[] {
		return this.services;
	}

	get totalCalculated(): number {
		return this.selectedItems.controls.reduce((total, control) => {
			const quantity = Number(control.get('quantity')?.value || 0);
			const unitPrice = Number(control.get('unitPrice')?.value || 0);
			return total + quantity * unitPrice;
		}, 0);
	}

	get isEditing(): boolean {
		return !!this.packageId;
	}

	isSelected(serviceId: string): boolean {
		return this.selectedItems.controls.some(
			(control) => control.get('serviceId')?.value === serviceId,
		);
	}

	toggleService(service: BackendServiceItem): void {
		const index = this.selectedItems.controls.findIndex(
			(control) => control.get('serviceId')?.value === service.id,
		);

		if (index >= 0) {
			this.selectedItems.removeAt(index);
		} else {
			this.selectedItems.push(
				this.fb.group({
					serviceId: [service.id, Validators.required],
					code: [service.code],
					name: [service.name],
					quantity: [1, [Validators.required, Validators.min(1)]],
					unitPrice: [
						this.resolveDefaultPrice(service),
						[Validators.required, Validators.min(0)],
					],
				}),
			);
		}

		this.syncFinalPriceIfAuto();
	}

	removeItem(index: number): void {
		this.selectedItems.removeAt(index);
		this.syncFinalPriceIfAuto();
	}

	onQuantityOrPriceChange(): void {
		this.syncFinalPriceIfAuto();
	}

	onFinalPriceInput(): void {
		this.finalPriceTouched = true;
	}

	onSearchInput(event: Event): void {
		const target = event.target as HTMLInputElement;
		this.search = target.value;

		if (this.searchDebounceHandle) {
			clearTimeout(this.searchDebounceHandle);
		}

		const term = this.search.trim();
		if (term.length === 0) {
			this.services = [];
			this.isLoadingServices = false;
			return;
		}

		this.searchDebounceHandle = setTimeout(() => {
			this.loadServices(term);
		}, 250);
	}

	closeModal(): void {
		this.close.emit();
	}

	save(): void {
		if (this.form.invalid || this.selectedItems.length === 0) {
			this.form.markAllAsTouched();
			this.selectedItems.markAllAsTouched();
			return;
		}

		this.isSaving = true;

		const dto = {
			name: String(this.form.value.name || '').trim(),
			description:
				String(this.form.value.description || '').trim() || undefined,
			packageCategoryId:
				String(this.form.value.packageCategoryId || '').trim() || undefined,
			items: this.selectedItems.controls.map(
				(control): CreateServicePackageItemInput => ({
					serviceId: String(control.get('serviceId')?.value),
					quantity: Number(control.get('quantity')?.value),
					unitPrice: Number(control.get('unitPrice')?.value),
					isMandatory: true,
				}),
			),
			finalPrice: Number(this.form.value.finalPrice),
			currency: 'COP',
		};

		const request$ = this.packageId
			? this.servicePackageService.updatePackage(this.packageId, dto)
			: this.servicePackageService.createPackage(dto);

		request$.subscribe({
			next: () => {
				this.isSaving = false;
				this.saved.emit();
			},
			error: (error) => {
				console.error('Error guardando paquete', error);
				this.loadError =
					error?.error?.error ||
					error?.error?.message ||
					'No se pudo guardar el paquete';
				this.isSaving = false;
			},
		});
	}

	private initializeModal(): void {
		this.loadError = null;
		this.finalPriceTouched = false;
		this.search = '';

		this.form.reset({
			name: '',
			description: '',
			packageCategoryId: '',
			finalPrice: 0,
		});
		this.selectedItems.clear();
		this.services = [];

		if (this.packageId) {
			this.loadPackage(this.packageId);
		}
	}

	private loadServices(term: string): void {
		this.isLoadingServices = true;
		this.loadError = null;

		this.serviceCatalogService.getServices({ search: term }).subscribe({
			next: (items) => {
				const normalizedTerm = term.toLowerCase();
				this.services = items.filter((item) =>
					item.code.toLowerCase().includes(normalizedTerm),
				);
				this.isLoadingServices = false;
			},
			error: (error) => {
				console.error('Error cargando servicios', error);
				this.loadError =
					error?.error?.error ||
					error?.error?.message ||
					'No se pudieron cargar servicios';
				this.isLoadingServices = false;
			},
		});
	}

	private loadPackage(id: string): void {
		this.servicePackageService.getPackageById(id).subscribe({
			next: (pkg) => this.fillFormFromPackage(pkg),
			error: (error) => {
				console.error('Error cargando paquete', error);
				this.loadError =
					error?.error?.error ||
					error?.error?.message ||
					'No se pudo cargar el paquete';
			},
		});
	}

	private fillFormFromPackage(pkg: ServicePackage): void {
		const defaultPrice =
			pkg.prices.find((price) => price.isDefault)?.amount ?? 0;

		this.form.patchValue({
			name: pkg.name,
			description: pkg.description || '',
			packageCategoryId: pkg.packageCategoryId || '',
			finalPrice: defaultPrice,
		});

		const selectedItems: SelectedServiceItem[] = pkg.items.map((item) => ({
			serviceId: item.serviceId,
			code: item.serviceCode || '',
			name: item.serviceName || 'Servicio',
			quantity: item.quantity,
			unitPrice:
				item.unitPrice ||
				this.resolveCurrentUnitPriceByServiceId(item.serviceId),
		}));

		selectedItems.forEach((item) => {
			this.selectedItems.push(
				this.fb.group({
					serviceId: [item.serviceId, Validators.required],
					code: [item.code],
					name: [item.name],
					quantity: [item.quantity, [Validators.required, Validators.min(1)]],
					unitPrice: [item.unitPrice, [Validators.required, Validators.min(0)]],
				}),
			);
		});
	}

	private syncFinalPriceIfAuto(): void {
		if (this.finalPriceTouched) {
			return;
		}

		this.form.patchValue({
			finalPrice: this.totalCalculated,
		});
	}

	private resolveDefaultPrice(service: BackendServiceItem): number {
		const rawValue = service.service_price?.[0]?.amount;
		if (rawValue === undefined || rawValue === null) {
			return 0;
		}

		return Number(rawValue);
	}

	private resolveCurrentUnitPriceByServiceId(serviceId: string): number {
		const service = this.services.find((item) => item.id === serviceId);
		if (!service) {
			return 0;
		}

		return this.resolveDefaultPrice(service);
	}
}
