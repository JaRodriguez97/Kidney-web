import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

export interface EducationCategory {
	id: string;
	name: string;
	slug: string;
}

export interface UploadCoverImageResponse {
	url: string;
}

export interface EducationArticleItem {
	id: string;
	title: string;
	slug: string;
	summary: string | null;
	content: string | null;
	coverImageUrl: string | null;
	readingTimeMinutes: number | null;
	categoryId: string | null;
	categoryName: string | null;
	authorId: string | null;
	authorName: string | null;
	status: AdminEducationRecentArticle['status'];
	requiresAssessment: boolean;
	requiresCertificate: boolean;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string | null;
}

export interface PaginatedEducationArticles {
	items: EducationArticleItem[];
	total: number;
	page: number;
	limit: number;
}

export interface CreateArticlePayload {
	title: string;
	slug: string;
	summary?: string | null;
	content?: string | null;
	coverImageUrl?: string | null;
	readingTimeMinutes?: number | null;
	categoryId?: string | null;
	requiresAssessment?: boolean;
	requiresCertificate?: boolean;
}

export interface UpdateArticlePayload extends Partial<CreateArticlePayload> {
	status?: AdminEducationRecentArticle['status'];
}

export interface CreateAssessmentPayload {
	title?: string;
	description?: string;
	passingScore: number;
	maxAttempts?: number;
	questions: Array<{
		questionText: string;
		questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
		points?: number;
		orderIndex?: number;
		options: Array<{
			optionText: string;
			isCorrect: boolean;
			orderIndex?: number;
		}>;
	}>;
}

@Injectable({
	providedIn: 'root',
})
export class EducationAdminService {
	private readonly apiUrl = environment.apiUrl + 'education';

	getApiBaseUrl(): string {
		return this.apiUrl.replace('/education', '');
	}

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

	getArticles(
		payload: {
			page?: number;
			limit?: number;
			status?: AdminEducationRecentArticle['status'];
			search?: string;
			categoryId?: string;
		} = {},
	): Observable<PaginatedEducationArticles> {
		let params = new HttpParams()
			.set('page', String(payload.page ?? 1))
			.set('limit', String(payload.limit ?? 20));

		if (payload.status) {
			params = params.set('status', payload.status);
		}
		if (payload.search?.trim()) {
			params = params.set('search', payload.search.trim());
		}
		if (payload.categoryId) {
			params = params.set('categoryId', payload.categoryId);
		}

		return this.http
			.get<{
				success: boolean;
				data: PaginatedEducationArticles;
			}>(`${this.apiUrl}/articles`, { params })
			.pipe(map((response) => response.data));
	}

	createArticle(
		payload: CreateArticlePayload,
	): Observable<EducationArticleItem> {
		return this.http
			.post<{
				success: boolean;
				data: EducationArticleItem;
			}>(`${this.apiUrl}/articles`, payload)
			.pipe(map((response) => response.data));
	}

	updateArticle(
		id: string,
		payload: UpdateArticlePayload,
	): Observable<EducationArticleItem> {
		return this.http
			.put<{
				success: boolean;
				data: EducationArticleItem;
			}>(`${this.apiUrl}/articles/${id}`, payload)
			.pipe(map((response) => response.data));
	}

	publishArticle(id: string): Observable<EducationArticleItem> {
		return this.http
			.patch<{
				success: boolean;
				data: EducationArticleItem;
			}>(`${this.apiUrl}/articles/${id}/publish`, {})
			.pipe(map((response) => response.data));
	}

	deleteArticle(id: string): Observable<void> {
		return this.http
			.delete<{ success: boolean }>(`${this.apiUrl}/articles/${id}`)
			.pipe(map(() => void 0));
	}

	getCategories(): Observable<EducationCategory[]> {
		return this.http
			.get<{
				success: boolean;
				data: EducationCategory[];
			}>(`${this.apiUrl}/categories`)
			.pipe(map((response) => response.data));
	}

	createCategory(name: string): Observable<EducationCategory> {
		return this.http
			.post<{
				success: boolean;
				data: EducationCategory;
			}>(`${this.apiUrl}/categories`, { name })
			.pipe(map((response) => response.data));
	}

	deleteCategory(id: string): Observable<void> {
		return this.http
			.delete<{ success: boolean }>(`${this.apiUrl}/categories/${id}`)
			.pipe(map(() => void 0));
	}

	uploadCoverImage(file: File): Observable<UploadCoverImageResponse> {
		const formData = new FormData();
		formData.append('file', file);

		return this.http
			.post<{
				success: boolean;
				data: UploadCoverImageResponse;
			}>(`${this.apiUrl}/images/cover`, formData)
			.pipe(map((response) => response.data));
	}

	createAssessment(
		articleId: string,
		payload: CreateAssessmentPayload,
	): Observable<void> {
		return this.http
			.post<{
				success: boolean;
			}>(`${this.apiUrl}/articles/${articleId}/assessment`, payload)
			.pipe(map(() => void 0));
	}
}
