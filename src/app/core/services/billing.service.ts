import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface CreateInvoiceRequest {
	appointmentId: string;
	serviceId?: string;
	notes?: string;
}

export interface CreateInvoiceResponse {
	invoiceId: string;
	invoiceNumber: string;
	status: string;
	totalAmount: number;
	currency: string;
}

export interface InitializePaymentRequest {
	paymentMethodCode: 'CARD' | 'PSE';
	notes?: string;
}

export interface InitializePaymentResponse {
	paymentId: string;
	paymentNumber: string;
	status: string;
	paymentUrl: string;
	externalReference: string;
}

export interface InvoiceDetailResponse {
	invoiceId: string;
	invoiceNumber: string;
	invoiceStatus: string;
	currency: string;
	subtotalAmount: number;
	totalAmount: number;
	patientName: string;
	serviceName: string;
	payment: {
		paymentId: string;
		paymentNumber: string;
		status: string;
		externalReference: string | null;
		paymentUrl: string | null;
	} | null;
}

@Injectable({
	providedIn: 'root',
})
export class BillingService {
	private readonly apiUrl = `${environment.apiUrl}billing`;

	constructor(private readonly http: HttpClient) {}

	createInvoice(
		payload: CreateInvoiceRequest,
	): Observable<CreateInvoiceResponse> {
		return this.http.post<CreateInvoiceResponse>(
			`${this.apiUrl}/invoices`,
			payload,
		);
	}

	initializePayment(
		invoiceId: string,
		payload: InitializePaymentRequest,
	): Observable<InitializePaymentResponse> {
		return this.http.post<InitializePaymentResponse>(
			`${this.apiUrl}/invoices/${invoiceId}/pay`,
			payload,
		);
	}

	getInvoice(invoiceId: string): Observable<InvoiceDetailResponse> {
		return this.http.get<InvoiceDetailResponse>(
			`${this.apiUrl}/invoices/${invoiceId}`,
		);
	}

	listInvoices(status?: string, page = 1, pageSize = 20): Observable<unknown> {
		let params = new HttpParams().set('page', page).set('pageSize', pageSize);
		if (status) {
			params = params.set('status', status);
		}
		return this.http.get(`${this.apiUrl}/invoices`, { params });
	}
}
