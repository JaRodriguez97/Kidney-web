import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BillingService } from './billing.service';

export interface BillingAdminItem {
	invoiceId: string;
	invoiceNumber: string;
	invoiceStatus: string;
	paymentStatus: string;
	patientName: string;
	serviceName: string;
	amount: number;
	createdAt: string;
}

export interface BillingAdminSummary {
	totalInvoiced: number;
	totalPaid: number;
	totalPending: number;
	totalFailed: number;
}

export interface BillingAdminResult {
	items: BillingAdminItem[];
	summary: BillingAdminSummary;
	pagination: {
		page: number;
		pageSize: number;
		total: number;
	};
}

@Injectable({
	providedIn: 'root',
})
export class BillingAdminService {
	private readonly billingService = inject(BillingService);

	listInvoices(
		status?: string,
		page = 1,
		pageSize = 20,
	): Observable<BillingAdminResult> {
		return this.billingService
			.listInvoices(status, page, pageSize)
			.pipe(map((result) => result as BillingAdminResult));
	}
}
