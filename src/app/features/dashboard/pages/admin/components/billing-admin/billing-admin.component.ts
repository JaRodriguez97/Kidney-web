import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	BillingAdminItem,
	BillingAdminResult,
	BillingAdminService,
} from '@app/core/services/billing-admin.service';
import { BillingService, InvoiceDetailResponse } from '@app/core/services/billing.service';

@Component({
	selector: 'app-billing-admin',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './billing-admin.component.html',
	styleUrl: './billing-admin.component.scss',
})
export class BillingAdminComponent implements OnInit {
	private readonly billingAdminService = inject(BillingAdminService);
	private readonly billingService = inject(BillingService);

	loading = false;
	errorMessage = '';
	rows: BillingAdminItem[] = [];
	filteredRows: BillingAdminItem[] = [];

	searchQuery = '';
	selectedStatus = '';

	summary: BillingAdminResult['summary'] = {
		totalInvoiced: 0,
		totalPaid: 0,
		totalPending: 0,
		totalFailed: 0,
	};

	selectedInvoiceDetail: InvoiceDetailResponse | null = null;
	loadingDetail = false;

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

	formatDate(isoDate: string): string {
		if (!isoDate) return 'N/A';
		return new Date(isoDate).toLocaleDateString('es-CO', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	loadData(): void {
		this.loading = true;
		this.errorMessage = '';

		this.billingAdminService
			.listInvoices(this.selectedStatus || undefined, 1, 50)
			.subscribe({
				next: (result) => {
					this.rows = result.items;
					this.summary = result.summary;
					this.applyFilter();
					this.loading = false;
				},
				error: () => {
					this.loading = false;
					this.errorMessage =
						'No fue posible cargar la información de facturación.';
				},
			});
	}

	applyFilter(): void {
		if (!this.searchQuery.trim()) {
			this.filteredRows = [...this.rows];
			return;
		}
		const q = this.searchQuery.toLowerCase().trim();
		this.filteredRows = this.rows.filter(
			(r) =>
				r.invoiceNumber.toLowerCase().includes(q) ||
				r.patientName.toLowerCase().includes(q) ||
				r.serviceName.toLowerCase().includes(q),
		);
	}

	openInvoiceDetail(invoiceId: string): void {
		this.loadingDetail = true;
		this.billingService.getInvoice(invoiceId).subscribe({
			next: (detail) => {
				this.selectedInvoiceDetail = detail;
				this.loadingDetail = false;
			},
			error: () => {
				this.loadingDetail = false;
			},
		});
	}

	closeModal(): void {
		this.selectedInvoiceDetail = null;
	}

	getStatusBadgeClass(status: string): string {
		switch (status?.toUpperCase()) {
			case 'PAID':
				return 'bg-emerald-50 text-emerald-700 border-emerald-200';
			case 'PENDING':
			case 'ISSUED':
			case 'DRAFT':
				return 'bg-amber-50 text-amber-700 border-amber-200';
			case 'FAILED':
			case 'CANCELLED':
				return 'bg-red-50 text-red-700 border-red-200';
			default:
				return 'bg-slate-100 text-slate-700 border-slate-200';
		}
	}

	getStatusLabel(status: string): string {
		switch (status?.toUpperCase()) {
			case 'PAID':
				return 'Pagado';
			case 'PENDING':
				return 'Pendiente';
			case 'ISSUED':
				return 'Emitida';
			case 'DRAFT':
				return 'Borrador';
			case 'FAILED':
				return 'Fallido';
			case 'UNPAID':
				return 'Sin Pagar';
			case 'CANCELLED':
				return 'Cancelado';
			default:
				return status || 'Pendiente';
		}
	}
}
