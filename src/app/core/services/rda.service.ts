import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface RdaDocumentResponse {
	id: string;
	careId: string;
	patientId: string;
	organizationId: string;
	rdaType: string;
	status: string;
	generatedAt: string;
	sentAt?: string;
	fhirBundleJson: Record<string, unknown>;
	transmissionResponseJson?: Record<string, unknown>;
}

@Injectable({
	providedIn: 'root',
})
export class RdaService {
	private readonly apiUrl = environment.apiUrl + 'rda';

	constructor(private readonly http: HttpClient) {}

	generateByCareId(careId: string): Observable<RdaDocumentResponse> {
		return this.http.post<RdaDocumentResponse>(
			`${this.apiUrl}/care/${careId}/generate`,
			{},
		);
	}

	getByCareId(careId: string): Observable<RdaDocumentResponse> {
		return this.http.get<RdaDocumentResponse>(`${this.apiUrl}/care/${careId}`);
	}

	transmitByCareId(careId: string): Observable<{ ok: boolean }> {
		return this.http.post<{ ok: boolean }>(
			`${this.apiUrl}/care/${careId}/transmit`,
			{},
		);
	}

	downloadPdfByCareId(careId: string): Observable<Blob> {
		return this.http.get(`${this.apiUrl}/care/${careId}/pdf`, {
			responseType: 'blob',
		});
	}

	downloadMockPreviewPdf(): Observable<Blob> {
		return this.http.get(`${this.apiUrl}/preview/pdf`, {
			responseType: 'blob',
		});
	}
}
