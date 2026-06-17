import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface OrganizationDashboardSummary {
	totalEmployees: number;
	pendingClinicalRequests: number;
	pendingInvoices: number;
}

export interface OrganizationDashboardEmployee {
	patientId: string;
	fullName: string;
	documentType: string | null;
	documentNumber: string | null;
	relationshipType: string;
	status: string;
}

export interface OrganizationDashboardLabRequest {
	appointmentId: string;
	patientName: string;
	serviceName: string;
	status: string;
	scheduledAt: string;
}

export interface OrganizationDashboardBilling {
	pendingAmount: number;
	lastPaidAmount: number;
	lastPaidAt: string | null;
}

export interface OrganizationDashboardResponse {
	organization: {
		id: string;
		legalName: string;
		documentNumber: string;
		status: string;
	};
	summary: OrganizationDashboardSummary;
	recentEmployees: OrganizationDashboardEmployee[];
	labRequests: OrganizationDashboardLabRequest[];
	billing: OrganizationDashboardBilling;
}

export interface CreateOrganizationDto {
	organization_code?: string;
	legal_name: string;
	trade_name?: string;
	document_type: string;
	entity_type: string;
	document_number: string;
	address?: string;
	neighborhood?: string;
	city: string;
	department: string;
	country?: string;
	email: string;
	password: string;
	phone?: string;
	website_url?: string;
	logo_url?: string;
	level_id?: string;
	status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

@Injectable({
	providedIn: 'root',
})
export class OrganizationService {
	private readonly baseUrl = environment.apiUrl + 'organizations/';

	constructor(private http: HttpClient) {}

	createOrganization(data: CreateOrganizationDto): Observable<any> {
		return this.http.post(this.baseUrl, data);
	}

	getDashboard(params?: {
		search?: string;
		limit?: number;
	}): Observable<OrganizationDashboardResponse> {
		return this.http.get<OrganizationDashboardResponse>(
			`${this.baseUrl}dashboard`,
			{
				params: {
					...(params?.search ? { search: params.search } : {}),
					...(params?.limit ? { limit: String(params.limit) } : {}),
				},
			},
		);
	}
}
