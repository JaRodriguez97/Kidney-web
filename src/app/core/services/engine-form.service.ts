import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export type EngineFormFieldType =
	| 'TEXT'
	| 'TEXTAREA'
	| 'NUMBER'
	| 'DATE'
	| 'DATETIME'
	| 'SELECT'
	| 'MULTISELECT'
	| 'CHECKBOX'
	| 'RADIO';

export interface EngineFormFieldOption {
	id: string;
	code: string | null;
	label: string;
	value: string | null;
	sortOrder: number | null;
}

export interface EngineFormRenderableField {
	id: string;
	code: string | null;
	label: string;
	fieldType: EngineFormFieldType;
	placeholder: string | null;
	isRequired: boolean;
	isReadonly: boolean;
	prefillResponse: {
		responseOptionId: string | null;
		responseText: string | null;
		responseNumeric: number | null;
		responseBoolean: boolean | null;
		responseDate: string | null;
		responseDatetime: string | null;
	} | null;
	sortOrder: number | null;
	options: EngineFormFieldOption[];
}

export interface EngineFormRenderableBlock {
	id: string;
	code: string | null;
	name: string;
	description: string | null;
	sortOrder: number;
	fields: EngineFormRenderableField[];
}

export interface EngineFormRenderableTemplate {
	id: string;
	code: string;
	name: string;
	description: string | null;
	activeVersion: {
		id: string;
		versionNumber: number;
		releaseNotes: string | null;
		blocks: EngineFormRenderableBlock[];
	} | null;
}

export interface EngineFormInstance {
	id: string;
	template_id: string;
	version_id: string;
	status: string;
	started_at: string;
	created_at: string;
	blocks: Array<{
		id: string;
		block_id: string;
		status: string;
		started_at: string;
		created_at: string;
	}>;
}

export interface CreateEngineFormInstanceRequest {
	templateId: string;
	patientId?: string;
	providerId?: string;
	appointmentId?: string;
}

export interface SaveEngineFormResponseRequestItem {
	fieldId: string;
	responseOptionId?: string;
	responseText?: string;
	responseNumeric?: number;
	responseBoolean?: boolean;
	responseDate?: string;
	responseDatetime?: string;
}

export interface SaveEngineFormResponsesRequest {
	responses: SaveEngineFormResponseRequestItem[];
}

export interface EngineFormInstanceBlockResponse {
	id: string;
	fieldId: string;
	responseOptionId: string | null;
	responseText: string | null;
	responseNumeric: number | null;
	responseBoolean: boolean | null;
	responseDate: string | null;
	responseDatetime: string | null;
}

export interface EngineFormAppointmentSession {
	isFirstVisit: boolean;
	appointment: {
		id: string;
		serviceId: string;
		serviceCode: string;
		serviceName: string;
		careModalityName: string | null;
		scheduledDate: string;
		startTime: string;
		endTime: string;
	};
	patient: {
		id: string;
		fullName: string;
		age: number | null;
		documentType: string | null;
		documentNumber: string | null;
		bloodType: string | null;
		allergies: string | null;
		riskIntegral: string | null;
	};
	provider: {
		id: string;
		fullName: string;
		providerTypeCode: string;
		providerTypeName: string;
	};
	template: EngineFormRenderableTemplate;
	instance: {
		id: string;
		status: string;
		startedAt: string;
		blocks: Array<{
			id: string;
			blockId: string;
			status: string;
			responses: EngineFormInstanceBlockResponse[];
		}>;
	};
}

@Injectable({
	providedIn: 'root',
})
export class EngineFormService {
	private readonly apiUrl = environment.apiUrl + 'engine-forms';

	constructor(private readonly http: HttpClient) {}

	listActiveTemplates(): Observable<
		Array<{
			id: string;
			code: string;
			name: string;
			description: string | null;
			activeVersion: { id: string; versionNumber: number } | null;
		}>
	> {
		return this.http.get<
			Array<{
				id: string;
				code: string;
				name: string;
				description: string | null;
				activeVersion: { id: string; versionNumber: number } | null;
			}>
		>(`${this.apiUrl}/templates/active`);
	}

	getRenderableTemplate(
		templateId: string,
	): Observable<EngineFormRenderableTemplate> {
		return this.http.get<EngineFormRenderableTemplate>(
			`${this.apiUrl}/templates/${templateId}/render`,
		);
	}

	createInstance(
		payload: CreateEngineFormInstanceRequest,
	): Observable<EngineFormInstance> {
		return this.http.post<EngineFormInstance>(
			`${this.apiUrl}/instances`,
			payload,
		);
	}

	saveBlockResponses(
		instanceId: string,
		instanceBlockId: string,
		payload: SaveEngineFormResponsesRequest,
	): Observable<unknown> {
		return this.http.post(
			`${this.apiUrl}/instances/${instanceId}/blocks/${instanceBlockId}/responses`,
			payload,
		);
	}

	getActiveFormByAppointment(
		appointmentId: string,
	): Observable<EngineFormAppointmentSession> {
		return this.http.get<EngineFormAppointmentSession>(
			`${this.apiUrl}/appointments/${appointmentId}/active-form`,
		);
	}
}
