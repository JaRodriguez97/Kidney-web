import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export type ProviderLabStatus =
	| 'SIN_VALIDAR'
	| 'TOMA'
	| 'PROCESADO'
	| 'PREELIMINAR'
	| 'CANCELADO';

export interface ProviderLabDashboardRow {
	appointmentId: string;
	patientId: string;
	patientName: string;
	patientDocumentType: string | null;
	patientDocumentNumber: string | null;
	serviceName: string;
	technicianName: string | null;
	scheduledDate: string;
	startTime: string;
	endTime: string;
	status: ProviderLabStatus;
}

export interface ProviderLabDashboardCalendarDay {
	date: string;
	appointments: number;
}

export interface ProviderLabDashboardStats {
	labsScheduled: number;
	samplesInTake: number;
	withoutValidation: number;
	totalMonthAppointments: number;
}

export interface GetProviderLabsDashboardResponse {
	date: string;
	month: string;
	scope: 'GLOBAL' | 'SELF';
	selectedProviderId: string | null;
	rows: ProviderLabDashboardRow[];
	calendarDays: ProviderLabDashboardCalendarDay[];
	stats: ProviderLabDashboardStats;
}

@Injectable({
	providedIn: 'root',
})
export class LabsDashboardService {
	private readonly apiUrl = environment.apiUrl + 'labs';

	constructor(private readonly http: HttpClient) {}

	getProviderDashboard(params?: {
		providerId?: string;
		search?: string;
		status?: ProviderLabStatus;
		date?: string;
		month?: string;
	}): Observable<GetProviderLabsDashboardResponse> {
		let httpParams = new HttpParams();

		if (params?.providerId) {
			httpParams = httpParams.set('providerId', params.providerId);
		}

		if (params?.search) {
			httpParams = httpParams.set('search', params.search);
		}

		if (params?.status) {
			httpParams = httpParams.set('status', params.status);
		}

		if (params?.date) {
			httpParams = httpParams.set('date', params.date);
		}

		if (params?.month) {
			httpParams = httpParams.set('month', params.month);
		}

		return this.http.get<GetProviderLabsDashboardResponse>(
			`${this.apiUrl}/provider-dashboard`,
			{ params: httpParams },
		);
	}
}
