import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export type SupportTicketCategory =
	| 'PLATFORM'
	| 'CONNECTIVITY'
	| 'EQUIPMENT'
	| 'OTHER';

export type SupportTicketStatus =
	| 'PENDING'
	| 'IN_REVIEW'
	| 'RESOLVED'
	| 'CLOSED';

export interface CreateSupportTicketRequest {
	subject: string;
	category: SupportTicketCategory;
	description: string;
	file?: File;
}

export interface SupportTicketListItem {
	id: string;
	subject: string;
	category: SupportTicketCategory;
	status: SupportTicketStatus;
	createdAt: string;
	hasAttachment: boolean;
}

export interface CreateSupportTicketResponse {
	ticket: SupportTicketListItem;
}

export interface ListSupportTicketsResponse {
	tickets: SupportTicketListItem[];
}

export type PlatformOperationalStatus = 'OPERATIVE' | 'DEGRADED' | 'DOWN';

export interface PlatformHealthItem {
	label: string;
	status: PlatformOperationalStatus;
	latencyMs: number | null;
}

export interface PlatformHealthResponse {
	checkedAt: string;
	serverCloud: PlatformHealthItem;
	applicationResponse: PlatformHealthItem;
	database: PlatformHealthItem;
}

@Injectable({
	providedIn: 'root',
})
export class SupportService {
	private readonly apiUrl = environment.apiUrl + 'support';

	constructor(private readonly http: HttpClient) {}

	createTicket(
		payload: CreateSupportTicketRequest,
	): Observable<CreateSupportTicketResponse> {
		const formData = new FormData();
		formData.append('subject', payload.subject);
		formData.append('category', payload.category);
		formData.append('description', payload.description);

		if (payload.file) {
			formData.append('file', payload.file);
		}

		return this.http.post<CreateSupportTicketResponse>(
			`${this.apiUrl}/tickets`,
			formData,
		);
	}

	listMyTickets(limit = 3): Observable<ListSupportTicketsResponse> {
		const params = new HttpParams().set('limit', String(limit));
		return this.http.get<ListSupportTicketsResponse>(`${this.apiUrl}/tickets`, {
			params,
		});
	}

	getPlatformHealth(): Observable<PlatformHealthResponse> {
		return this.http.get<PlatformHealthResponse>(
			`${this.apiUrl}/platform-health`,
		);
	}
}
