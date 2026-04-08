import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { map, Observable } from 'rxjs';

export interface BackendServiceItem {
	id: string;
	code: string;
	name: string;
	description: string | null;
	service_type:
		| 'MEDICAL_CONSULTATION'
		| 'NURSING'
		| 'NUTRITION'
		| 'PSYCHOLOGY'
		| 'SOCIAL_WORK'
		| 'REHABILITATION'
		| 'PHARMACY'
		| 'TELEMEDICINE'
		| 'LABORATORY'
		| 'PROCEDURE'
		| 'IMAGING'
		| 'OTHER';
	is_active: boolean;
	created_at: string;
}

export interface ImportCupsResult {
	catalogVersionId: string;
	totalRows: number;
	validRows: number;
	importedProcedures: number;
	createdServices: number;
	updatedServices: number;
	skippedRows: number;
	duplicateCodes: number;
	errors: string[];
}

export interface ServiceFilters {
	serviceType?: BackendServiceItem['service_type'];
	search?: string;
	cupsPrefixes?: string[];
}

@Injectable({
	providedIn: 'root',
})
export class ServiceCatalogService {
	private readonly API_URL = environment.apiUrl + 'services';

	constructor(private http: HttpClient) {}

	getServices(filters?: ServiceFilters): Observable<BackendServiceItem[]> {
		let params = new HttpParams();

		if (filters?.serviceType) {
			params = params.set('serviceType', filters.serviceType);
		}

		if (filters?.search?.trim()) {
			params = params.set('search', filters.search.trim());
		}

		if (filters?.cupsPrefixes?.length) {
			const prefixes = filters.cupsPrefixes
				.map((prefix) => prefix.trim())
				.filter((prefix) => prefix.length >= 2);

			if (prefixes.length) {
				params = params.set('cupsPrefixes', prefixes.join(','));
			}
		}

		return this.http
			.get<{ success: boolean; data: BackendServiceItem[] }>(this.API_URL, {
				params,
			})
			.pipe(map((response) => response.data));
	}

	uploadCupsExcel(file: File): Observable<ImportCupsResult> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<{
				success: boolean;
				data: ImportCupsResult;
			}>(`${this.API_URL}/upload-cups`, formData)
			.pipe(map((response) => response.data));
	}
}
