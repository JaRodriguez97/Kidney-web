import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';

export interface AdminEducationRecentArticle {
	id: string;
	title: string;
	summary: string | null;
	status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
	categoryName: string | null;
	authorName: string | null;
	publishedAt: string | null;
	createdAt: string;
}

export interface AdminEducationSummary {
	totalArticles: number;
	publishedArticles: number;
	totalCertificates: number;
}

export interface GetAdminEducationDashboardResponse {
	summary: AdminEducationSummary;
	recentArticles: AdminEducationRecentArticle[];
}

@Injectable({
	providedIn: 'root',
})
export class EducationAdminService {
	private readonly apiUrl = environment.apiUrl + 'education';

	constructor(private readonly http: HttpClient) {}

	getAdminDashboard(
		limit?: number,
	): Observable<GetAdminEducationDashboardResponse> {
		let params = new HttpParams();

		if (limit && Number.isFinite(limit)) {
			params = params.set('limit', String(limit));
		}

		return this.http.get<GetAdminEducationDashboardResponse>(
			`${this.apiUrl}/admin-dashboard`,
			{ params },
		);
	}
}
