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

export interface SupportTicketMessageItem {
	id: string;
	ticketId: string;
	senderUserId: string;
	senderName?: string;
	senderRole?: string;
	message: string;
	attachmentUrl?: string | null;
	createdAt: string;
}

export interface SupportTicketDetail {
	id: string;
	reporterUserId: string;
	reporterProviderId: string | null;
	reporterName?: string;
	reporterEmail?: string;
	subject: string;
	category: SupportTicketCategory;
	description: string;
	status: SupportTicketStatus;
	assignedToUserId?: string | null;
	assignedToName?: string | null;
	createdAt: string;
	updatedAt: string | null;
	resolvedAt: string | null;
	attachments?: Array<{ id: string; fileName: string; mimeType: string; fileSizeBytes: number; fileUrl?: string }>;
	messages?: SupportTicketMessageItem[];
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

	listMyTickets(limit = 10): Observable<ListSupportTicketsResponse> {
		const params = new HttpParams().set('limit', String(limit));
		return this.http.get<ListSupportTicketsResponse>(`${this.apiUrl}/tickets`, {
			params,
		});
	}

	respondTicket(ticketId: string, message: string, attachmentUrl?: string): Observable<SupportTicketMessageItem> {
		return this.http.post<SupportTicketMessageItem>(`${this.apiUrl}/tickets/${ticketId}/messages`, {
			message,
			attachmentUrl,
		});
	}

	updateTicketStatus(ticketId: string, status: SupportTicketStatus): Observable<SupportTicketDetail> {
		return this.http.patch<SupportTicketDetail>(`${this.apiUrl}/tickets/${ticketId}/status`, {
			status,
		});
	}

	assignTicketAgent(ticketId: string, agentUserId: string): Observable<SupportTicketDetail> {
		return this.http.patch<SupportTicketDetail>(`${this.apiUrl}/tickets/${ticketId}/assign`, {
			agentUserId,
		});
	}

	getTicketMessages(ticketId: string): Observable<SupportTicketDetail> {
		return this.http.get<SupportTicketDetail>(`${this.apiUrl}/tickets/${ticketId}/messages`);
	}

	listAllTicketsAdmin(params?: {
		status?: string;
		category?: string;
		search?: string;
		page?: number;
		limit?: number;
	}): Observable<{ tickets: SupportTicketDetail[]; total: number }> {
		let httpParams = new HttpParams();
		if (params?.status) httpParams = httpParams.set('status', params.status);
		if (params?.category) httpParams = httpParams.set('category', params.category);
		if (params?.search) httpParams = httpParams.set('search', params.search);
		if (params?.page) httpParams = httpParams.set('page', String(params.page));
		if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));

		return this.http.get<{ tickets: SupportTicketDetail[]; total: number }>(
			`${this.apiUrl}/admin/tickets`,
			{ params: httpParams },
		);
	}

	getPlatformHealth(): Observable<PlatformHealthResponse> {
		return this.http.get<PlatformHealthResponse>(
			`${this.apiUrl}/platform-health`,
		);
	}
}
