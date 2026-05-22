import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { map, Observable } from 'rxjs';

export type ArticleStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';

export interface EducationArticle {
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
	status: ArticleStatus;
	requiresAssessment: boolean;
	requiresCertificate: boolean;
	publishedAt: string | null;
	createdAt: string;
	updatedAt: string | null;
}

export interface PaginatedEducationArticles {
	items: EducationArticle[];
	total: number;
	page: number;
	limit: number;
}

export interface EducationCategory {
	id: string;
	name: string;
	slug: string;
}

export interface ReadingAccessSession {
	id: string;
	articleId: string;
	userId: string;
	accessedAt: string;
}

export interface ArticleProgress {
	id: string;
	articleId: string;
	userId: string;
	progressPercentage: number;
	lastPosition: number | null;
	totalTimeSeconds: number;
	status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
	completedAt: string | null;
	updatedAt: string | null;
}

export interface AssessmentOption {
	id: string;
	optionText: string;
	orderIndex: number | null;
}

export interface AssessmentQuestion {
	id: string;
	questionText: string;
	questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
	orderIndex: number | null;
	points: number;
	options: AssessmentOption[];
}

export interface ArticleAssessment {
	id: string;
	articleId: string;
	title: string | null;
	description: string | null;
	passingScore: number;
	maxAttempts: number;
	questions: AssessmentQuestion[];
}

export interface SubmitAssessmentResult {
	attemptId: string;
	articleId: string;
	score: number;
	passed: boolean;
	totalQuestions: number;
	correctAnswers: number;
	certificate: CertificateData | null;
}

export interface CertificateData {
	id: string;
	articleId: string;
	userId: string;
	certificateCode: string;
	renderedHtml: string;
	finalScore: number;
	issuedAt: string;
}

@Injectable({
	providedIn: 'root',
})
export class BlogService {
	private readonly apiUrl = environment.apiUrl + 'education';

	constructor(private readonly http: HttpClient) {}

	getPublishedArticles(
		page = 1,
		limit = 20,
		search?: string,
	): Observable<PaginatedEducationArticles> {
		let params = new HttpParams()
			.set('page', String(page))
			.set('limit', String(limit));
		if (search?.trim()) {
			params = params.set('search', search.trim());
		}

		return this.http
			.get<{
				success: boolean;
				data: PaginatedEducationArticles;
			}>(`${this.apiUrl}/articles/public`, { params })
			.pipe(map((response) => response.data));
	}

	getArticleBySlug(slug: string): Observable<EducationArticle> {
		return this.http
			.get<{
				success: boolean;
				data: EducationArticle;
			}>(`${this.apiUrl}/articles/public/${slug}`)
			.pipe(map((response) => response.data));
	}

	getCategories(): Observable<EducationCategory[]> {
		return this.http
			.get<{
				success: boolean;
				data: EducationCategory[];
			}>(`${this.apiUrl}/categories`)
			.pipe(map((response) => response.data));
	}

	startAccess(articleId: string): Observable<ReadingAccessSession> {
		return this.http
			.post<{
				success: boolean;
				data: ReadingAccessSession;
			}>(`${this.apiUrl}/articles/${articleId}/access/start`, {})
			.pipe(map((response) => response.data));
	}

	closeAccess(payload: {
		accessLogId: string;
		durationSeconds: number;
		maxScrollPercentage: number;
	}): Observable<void> {
		return this.http
			.patch<{
				success: boolean;
			}>(`${this.apiUrl}/articles/access/close`, payload)
			.pipe(map(() => void 0));
	}

	trackProgress(
		articleId: string,
		payload: {
			progressPercentage: number;
			lastPosition?: number;
			totalTimeSeconds?: number;
		},
	): Observable<ArticleProgress> {
		return this.http
			.post<{
				success: boolean;
				data: ArticleProgress;
			}>(`${this.apiUrl}/articles/${articleId}/progress`, payload)
			.pipe(map((response) => response.data));
	}

	getAssessment(articleId: string): Observable<ArticleAssessment> {
		return this.http
			.get<{
				success: boolean;
				data: ArticleAssessment;
			}>(`${this.apiUrl}/articles/${articleId}/assessment`)
			.pipe(map((response) => response.data));
	}

	submitAssessment(payload: {
		assessmentId: string;
		answers: Array<{ questionId: string; selectedOptionId: string }>;
	}): Observable<SubmitAssessmentResult> {
		return this.http
			.post<{
				success: boolean;
				data: SubmitAssessmentResult;
			}>(`${this.apiUrl}/assessment/submit`, payload)
			.pipe(map((response) => response.data));
	}

	getCertificate(articleId: string): Observable<CertificateData> {
		return this.http
			.get<{
				success: boolean;
				data: CertificateData;
			}>(`${this.apiUrl}/certificates/${articleId}`)
			.pipe(map((response) => response.data));
	}
}
