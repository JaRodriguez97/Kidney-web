import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
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
		isSuperAliado: boolean;
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
	public readonly refresh$ = new Subject<void>();

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

	getProfile(): Observable<any> {
		return this.http.get<any>(`${this.baseUrl}profile`);
	}

	updateProfile(data: any): Observable<any> {
		return this.http.put<any>(`${this.baseUrl}profile`, data);
	}

	uploadLogo(file: File): Observable<any> {
		const formData = new FormData();
		formData.append('logo', file);
		return this.http.post<any>(`${this.baseUrl}profile/logo`, formData);
	}

	requestUpgrade(): Observable<any> {
		return this.http.post<any>(`${this.baseUrl}upgrade`, {});
	}

	getPatients(params?: {
		search?: string;
		page?: number;
		limit?: number;
	}): Observable<any> {
		return this.http.get<any>(`${this.baseUrl}patients`, {
			params: {
				...(params?.search ? { search: params.search } : {}),
				...(params?.page ? { page: String(params.page) } : {}),
				...(params?.limit ? { limit: String(params.limit) } : {}),
			},
		});
	}

	getPatientDetail(patientId: string): Observable<any> {
		return this.http.get<any>(`${this.baseUrl}patients/${patientId}`);
	}

	getClinicalRequests(params?: {
		search?: string;
		date?: string;
		page?: number;
		limit?: number;
	}): Observable<any> {
		return this.http.get<any>(`${this.baseUrl}clinical-requests`, {
			params: {
				...(params?.search ? { search: params.search } : {}),
				...(params?.date ? { date: params.date } : {}),
				...(params?.page ? { page: String(params.page) } : {}),
				...(params?.limit ? { limit: String(params.limit) } : {}),
			},
		});
	}

	getResults(params?: {
		search?: string;
		date?: string;
		page?: number;
		limit?: number;
	}): Observable<any> {
		return this.http.get<any>(`${this.baseUrl}results`, {
			params: {
				...(params?.search ? { search: params.search } : {}),
				...(params?.date ? { date: params.date } : {}),
				...(params?.page ? { page: String(params.page) } : {}),
				...(params?.limit ? { limit: String(params.limit) } : {}),
			},
		});
	}

	createAccessRequest(data: any): Observable<any> {
		return this.http.post<any>(`${this.baseUrl}access-request`, data);
	}

	approveAccessRequest(id: string): Observable<any> {
		return this.http.post<any>(`${this.baseUrl}access-request/${id}/approve`, {});
	}

	rejectAccessRequest(id: string, reason?: string): Observable<any> {
		return this.http.post<any>(`${this.baseUrl}access-request/${id}/reject`, { reason });
	}

	createClinicalRequests(data: { patientIds: string[]; packageId: string }): Observable<any> {
		return this.http.post<any>(`${this.baseUrl}clinical-requests`, data);
	}
}
