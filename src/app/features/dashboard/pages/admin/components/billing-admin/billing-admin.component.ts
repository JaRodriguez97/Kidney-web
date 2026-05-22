import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
	BillingAdminItem,
	BillingAdminResult,
	BillingAdminService,
} from '@app/core/services/billing-admin.service';

@Component({
	selector: 'app-billing-admin',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './billing-admin.component.html',
	styleUrl: './billing-admin.component.scss',
})
export class BillingAdminComponent implements OnInit {
	private readonly billingAdminService = inject(BillingAdminService);

	loading = false;
	errorMessage = '';
	rows: BillingAdminItem[] = [];
	summary: BillingAdminResult['summary'] = {
		totalInvoiced: 0,
		totalPaid: 0,
		totalPending: 0,
		totalFailed: 0,
	};

	ngOnInit(): void {
		this.loadData();
	}

	formatMoney(amount: number): string {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			maximumFractionDigits: 0,
		}).format(amount);
	}

	private loadData(): void {
		this.loading = true;
		this.errorMessage = '';

		this.billingAdminService.listInvoices(undefined, 1, 30).subscribe({
			next: (result) => {
				this.rows = result.items;
				this.summary = result.summary;
				this.loading = false;
			},
			error: () => {
				this.loading = false;
				this.errorMessage =
					'No fue posible cargar la información de facturación.';
			},
		});
	}
}
