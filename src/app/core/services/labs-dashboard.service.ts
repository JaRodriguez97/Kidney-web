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

export type LabResultStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'PUBLISHED';

export type LabResultValueFlag = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface LabResultValue {
	fieldName: string;
	value: string | number;
	unit: string | null;
	referenceRange: string | null;
	flag: LabResultValueFlag | null;
}

export interface RegisterLabResultRequest {
	resultValues: LabResultValue[];
	notes?: string;
}

export interface RegisterLabResultResponse {
	appointmentId: string;
}

export interface SubmitLabResultForValidationResponse {
	appointmentId: string;
	resultStatus: 'PENDING_VALIDATION';
}

export interface PublishLabResultResponse {
	appointmentId: string;
	resultStatus: 'PUBLISHED';
}

export interface LabResultDetailResponse {
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
	appointmentStatus: ProviderLabStatus;
	resultStatus: LabResultStatus;
	resultValues: LabResultValue[];
	notes: string | null;
	recordedAt: string;
	validatedAt: string | null;
	validatedByName: string | null;
}

export interface PatientLabResultRow {
	appointmentId: string;
	serviceName: string;
	scheduledDate: string;
	resultStatus: LabResultStatus;
	technicianName: string | null;
	hasDocument: boolean;
}

export interface GetPatientLabResultsResponse {
	rows: PatientLabResultRow[];
}

export type AdminResultFilterStatus =
	| 'PENDIENTE_FIRMA'
	| 'REVISION'
	| 'PUBLICADO';

export interface AdminLabResultDashboardRow {
	appointmentId: string;
	patientName: string;
	patientDocumentType: string | null;
	patientDocumentNumber: string | null;
	serviceName: string;
	technicianName: string | null;
	scheduledDate: string;
	appointmentStatus: ProviderLabStatus;
	resultStatus: LabResultStatus;
	validatedAt: string | null;
}

export interface GetAdminLabResultsDashboardResponse {
	date: string;
	month: string;
	rows: AdminLabResultDashboardRow[];
	stats: {
		pendingValidation: number;
		inRevision: number;
		published: number;
	};
}

export interface ProviderLabDashboardRow {
	appointmentId: string;
	patientId: string;
	patientName: string;
	patientDocumentType: string | null;
	patientDocumentNumber: string | null;
	serviceName: string;
	technicianName: string | null;
	originProviderName: string | null;
	scheduledDate: string;
	startTime: string;
	endTime: string;
	status: ProviderLabStatus;
	resultStatus: LabResultStatus | null;
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

	getAdminResultsDashboard(params?: {
		search?: string;
		status?: AdminResultFilterStatus;
		date?: string;
		month?: string;
	}): Observable<GetAdminLabResultsDashboardResponse> {
		let httpParams = new HttpParams();

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

		return this.http.get<GetAdminLabResultsDashboardResponse>(
			`${this.apiUrl}/results-dashboard`,
			{ params: httpParams },
		);
	}

	registerResult(
		appointmentId: string,
		payload: RegisterLabResultRequest,
	): Observable<RegisterLabResultResponse> {
		return this.http.post<RegisterLabResultResponse>(
			`${this.apiUrl}/${appointmentId}/results`,
			payload,
		);
	}

	publishResult(appointmentId: string): Observable<PublishLabResultResponse> {
		return this.http.patch<PublishLabResultResponse>(
			`${this.apiUrl}/${appointmentId}/results/publish`,
			{},
		);
	}

	submitResultForValidation(
		appointmentId: string,
	): Observable<SubmitLabResultForValidationResponse> {
		return this.http.patch<SubmitLabResultForValidationResponse>(
			`${this.apiUrl}/${appointmentId}/results/submit-validation`,
			{},
		);
	}

	getResultDetail(appointmentId: string): Observable<LabResultDetailResponse> {
		return this.http.get<LabResultDetailResponse>(
			`${this.apiUrl}/${appointmentId}/result`,
		);
	}

	downloadResultPdf(appointmentId: string): Observable<Blob> {
		return this.http.get(`${this.apiUrl}/${appointmentId}/result/pdf`, {
			responseType: 'blob',
		});
	}

	getMyResults(params?: {
		search?: string;
		date?: string;
	}): Observable<GetPatientLabResultsResponse> {
		let httpParams = new HttpParams();

		if (params?.search) {
			httpParams = httpParams.set('search', params.search);
		}

		if (params?.date) {
			httpParams = httpParams.set('date', params.date);
		}

		return this.http.get<GetPatientLabResultsResponse>(
			`${this.apiUrl}/my-results`,
			{
				params: httpParams,
			},
		);
	}

	getPatientLabHistoryForProvider(
		patientId: string,
		params?: {
			search?: string;
			date?: string;
		},
	): Observable<GetPatientLabResultsResponse> {
		let httpParams = new HttpParams();

		if (params?.search) {
			httpParams = httpParams.set('search', params.search);
		}

		if (params?.date) {
			httpParams = httpParams.set('date', params.date);
		}

		return this.http.get<GetPatientLabResultsResponse>(
			`${this.apiUrl}/patients/${patientId}/results`,
			{
				params: httpParams,
			},
		);
	}
}
