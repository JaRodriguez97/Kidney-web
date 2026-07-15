import { Component, inject, OnInit } from '@angular/core';
import { OrganizationService } from '@app/core/services/organization.service';
import { BillingService } from '@app/core/services/billing.service';
import { DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-payments-organization',
	standalone: true,
	imports: [NgClass, DatePipe, CurrencyPipe, FormsModule],
	templateUrl: './payments-organization.component.html',
	styleUrl: './payments-organization.component.scss',
})
export class PaymentsOrganizationComponent implements OnInit {
	private readonly organizationService = inject(OrganizationService);
	private readonly billingService = inject(BillingService);

	loading = true;
	invoices: any[] = [];
	total = 0;
	page = 1;
	limit = 10;
	statusFilter = '';

	// Organization Details
	organizationName = '';
	organizationNit = '';
	contactPersonName = '';

	summary = {
		totalInvoiced: 0,
		totalPaid: 0,
		totalPending: 0,
		totalFailed: 0,
	};

	ngOnInit(): void {
		this.loadOrganizationDetails();
		this.loadInvoices();
	}

	loadOrganizationDetails(): void {
		this.organizationService.getDashboard({ limit: 1 }).subscribe({
			next: (res) => {
				if (res && res.organization) {
					this.organizationName = res.organization.legalName;
					this.organizationNit = res.organization.documentNumber;
				}
			},
			error: (err) => {
				console.error('Error loading organization details', err);
			}
		});

		this.organizationService.getProfile().subscribe({
			next: (profile) => {
				if (profile && profile.contact_person_name) {
					this.contactPersonName = profile.contact_person_name;
				}
			},
			error: (err) => {
				console.error('Error loading organization profile details', err);
			}
		});
	}

	loadInvoices(): void {
		this.loading = true;
		this.billingService
			.listInvoices(this.statusFilter || undefined, this.page, this.limit)
			.subscribe({
				next: (response: any) => {
					this.invoices = response.items;
					this.summary = response.summary;
					this.total = response.pagination.total;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading invoices', error);
					this.loading = false;
				},
			});
	}

	onFilterChange(): void {
		this.page = 1;
		this.loadInvoices();
	}

	prevPage(): void {
		if (this.page > 1) {
			this.page--;
			this.loadInvoices();
		}
	}

	nextPage(): void {
		if (this.page * this.limit < this.total) {
			this.page++;
			this.loadInvoices();
		}
	}

	payInvoice(invoiceId: string): void {
		this.billingService.initializePayment(invoiceId, { paymentMethodCode: 'PSE' }).subscribe({
			next: (res) => {
				if (res && res.paymentUrl) {
					window.open(res.paymentUrl, '_blank');
				}
			},
			error: (err) => {
				console.error('Error initializing payment', err);
			}
		});
	}
}
