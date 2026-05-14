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

export type ActiveStatus = 'ACTIVE' | 'INACTIVE';

export interface EngineFormAdminVersionSummary {
	id: string;
	versionNumber: number;
	isActive: boolean;
	releaseNotes: string | null;
	createdAt: string;
}

export interface EngineFormAdminTemplateListItem {
	id: string;
	code: string;
	name: string;
	description: string | null;
	status: ActiveStatus;
	activeVersion: {
		id: string;
		versionNumber: number;
	} | null;
	versionsCount: number;
}

export interface EngineFormAdminFieldOption {
	id: string;
	code: string | null;
	label: string;
	value: string | null;
	sortOrder: number | null;
}

export interface EngineFormAdminField {
	id: string;
	code: string | null;
	label: string;
	fieldType: EngineFormFieldType;
	placeholder: string | null;
	isRequired: boolean;
	status: ActiveStatus;
	sortOrder: number | null;
	options: EngineFormAdminFieldOption[];
}

export interface EngineFormAdminBlock {
	id: string;
	code: string | null;
	name: string;
	description: string | null;
	status: ActiveStatus;
	sortOrder: number;
	isInActiveVersion: boolean;
	fields: EngineFormAdminField[];
}

export interface EngineFormAdminTemplateDetail {
	id: string;
	code: string;
	name: string;
	description: string | null;
	status: ActiveStatus;
	activeVersionId: string | null;
	versions: EngineFormAdminVersionSummary[];
	blocks: EngineFormAdminBlock[];
}

export interface EngineFormAdminBlockCatalogItem {
	id: string;
	code: string | null;
	name: string;
	description: string | null;
	status: ActiveStatus;
	sortOrder: number;
	templateId: string;
	templateName: string;
	fieldsCount: number;
}

export interface EngineFormAdminFieldCatalogItem {
	id: string;
	code: string | null;
	label: string;
	fieldType: EngineFormFieldType;
	placeholder: string | null;
	isRequired: boolean;
	status: ActiveStatus;
	sortOrder: number | null;
	blockId: string;
	blockName: string;
	templateId: string;
	templateName: string;
}

export interface CreateTemplatePayload {
	code: string;
	name: string;
	description?: string;
}

export interface UpdateTemplatePayload {
	name?: string;
	description?: string | null;
	status?: ActiveStatus;
}

export interface CreateBlockPayload {
	code?: string;
	name: string;
	description?: string;
	sortOrder: number;
}

export interface UpdateBlockPayload {
	name?: string;
	description?: string | null;
	sortOrder?: number;
	status?: ActiveStatus;
}

export interface CreateFieldOptionPayload {
	code?: string;
	label: string;
	value?: string;
	sortOrder?: number;
}

export interface CreateFieldPayload {
	code?: string;
	label: string;
	fieldType: EngineFormFieldType;
	placeholder?: string;
	isRequired?: boolean;
	sortOrder?: number;
	options?: CreateFieldOptionPayload[];
}

export interface UpdateFieldPayload {
	label?: string;
	placeholder?: string | null;
	isRequired?: boolean;
	sortOrder?: number;
	status?: ActiveStatus;
}

@Injectable({
	providedIn: 'root',
})
export class EngineFormAdminService {
	private readonly apiUrl = environment.apiUrl + 'engine-forms';

	constructor(private readonly http: HttpClient) {}

	listAllTemplates(): Observable<EngineFormAdminTemplateListItem[]> {
		return this.http.get<EngineFormAdminTemplateListItem[]>(
			`${this.apiUrl}/templates`,
		);
	}

	listAllBlocks(): Observable<EngineFormAdminBlockCatalogItem[]> {
		return this.http.get<EngineFormAdminBlockCatalogItem[]>(
			`${this.apiUrl}/blocks`,
		);
	}

	listAllFields(): Observable<EngineFormAdminFieldCatalogItem[]> {
		return this.http.get<EngineFormAdminFieldCatalogItem[]>(
			`${this.apiUrl}/fields`,
		);
	}

	getTemplateDetail(
		templateId: string,
	): Observable<EngineFormAdminTemplateDetail> {
		return this.http.get<EngineFormAdminTemplateDetail>(
			`${this.apiUrl}/templates/${templateId}/detail`,
		);
	}

	getVersionBlocks(versionId: string): Observable<EngineFormAdminBlock[]> {
		return this.http.get<EngineFormAdminBlock[]>(
			`${this.apiUrl}/versions/${versionId}/blocks`,
		);
	}

	createTemplate(payload: CreateTemplatePayload): Observable<{ id: string }> {
		return this.http.post<{ id: string }>(`${this.apiUrl}/templates`, payload);
	}

	updateTemplate(
		templateId: string,
		payload: UpdateTemplatePayload,
	): Observable<unknown> {
		return this.http.put(`${this.apiUrl}/templates/${templateId}`, payload);
	}

	createBlock(
		templateId: string,
		payload: CreateBlockPayload,
	): Observable<{ id: string }> {
		return this.http.post<{ id: string }>(
			`${this.apiUrl}/templates/${templateId}/blocks`,
			payload,
		);
	}

	updateBlock(
		blockId: string,
		payload: UpdateBlockPayload,
	): Observable<unknown> {
		return this.http.put(`${this.apiUrl}/blocks/${blockId}`, payload);
	}

	deleteBlock(blockId: string): Observable<unknown> {
		return this.http.delete(`${this.apiUrl}/blocks/${blockId}`);
	}

	createField(
		blockId: string,
		payload: CreateFieldPayload,
	): Observable<{ id: string }> {
		return this.http.post<{ id: string }>(
			`${this.apiUrl}/blocks/${blockId}/fields`,
			payload,
		);
	}

	cloneFieldToBlock(
		fieldId: string,
		payload: { blockId: string; sortOrder?: number },
	): Observable<{ id: string }> {
		return this.http.post<{ id: string }>(
			`${this.apiUrl}/fields/${fieldId}/clone`,
			payload,
		);
	}

	updateField(
		fieldId: string,
		payload: UpdateFieldPayload,
	): Observable<unknown> {
		return this.http.put(`${this.apiUrl}/fields/${fieldId}`, payload);
	}

	deleteField(fieldId: string): Observable<unknown> {
		return this.http.delete(`${this.apiUrl}/fields/${fieldId}`);
	}

	createVersion(
		templateId: string,
		payload: { releaseNotes?: string; blockIds?: string[] },
	): Observable<{ id: string }> {
		return this.http.post<{ id: string }>(
			`${this.apiUrl}/templates/${templateId}/versions`,
			payload,
		);
	}

	publishVersion(versionId: string): Observable<unknown> {
		return this.http.post(`${this.apiUrl}/versions/${versionId}/publish`, {});
	}

	deleteVersion(versionId: string): Observable<unknown> {
		return this.http.delete(`${this.apiUrl}/versions/${versionId}`);
	}
}
