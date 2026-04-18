import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export type ClinicalRecordRisk = 'HIGH' | 'MODERATE' | 'LOW' | 'UNCLASSIFIED';

export interface ProviderClinicalRecordItem {
	patientId: string;
	fullName: string;
	documentType: string | null;
	documentNumber: string | null;
	age: number | null;
	lastAttentionDate: string | null;
	riskLevel: ClinicalRecordRisk;
	lastDiagnosis: string | null;
	totalCareEvents: number;
	completedCareCount: number;
	followUpRequired: boolean;
}

export interface ProviderClinicalRecordStats {
	totalPatients: number;
	completedHistoriesPercentage: number;
	criticalRiskPercentage: number;
	averageVisitsPerPatient: number;
	followUpRequiredPatients: number;
}

export interface ProviderClinicalRecordsResponse {
	scope: 'GLOBAL' | 'SELF';
	selectedProviderId: string | null;
	stats: ProviderClinicalRecordStats;
	patients: ProviderClinicalRecordItem[];
}

@Injectable({
	providedIn: 'root',
})
export class ClinicalRecordService {
	private readonly apiUrl = environment.apiUrl + 'clinical-record';

	constructor(private readonly http: HttpClient) {}

	getProviderDashboard(params?: {
		providerId?: string;
		search?: string;
		risk?: ClinicalRecordRisk;
		fromDate?: string;
		toDate?: string;
	}): Observable<ProviderClinicalRecordsResponse> {
		let httpParams = new HttpParams();

		if (params?.providerId) {
			httpParams = httpParams.set('providerId', params.providerId);
		}

		if (params?.search) {
			httpParams = httpParams.set('search', params.search);
		}

		if (params?.risk) {
			httpParams = httpParams.set('risk', params.risk);
		}

		if (params?.fromDate) {
			httpParams = httpParams.set('fromDate', params.fromDate);
		}

		if (params?.toDate) {
			httpParams = httpParams.set('toDate', params.toDate);
		}

		return this.http.get<ProviderClinicalRecordsResponse>(
			`${this.apiUrl}/provider-dashboard`,
			{ params: httpParams },
		);
	}
}
