import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxEditorModule, Editor, Toolbar, toHTML } from 'ngx-editor';
import {
	AdminEducationRecentArticle,
	CreateAssessmentPayload,
	CreateArticlePayload,
	EducationAdminService,
	EducationArticleItem,
	EducationCategory,
	GetAdminEducationDashboardResponse,
	PaginatedEducationArticles,
} from '@app/core/services/education-admin.service';
import { UserService } from '@app/core/services/user.service';
import { formatColombiaDate } from '@app/shared/utils/colombia-date.utils';

@Component({
	selector: 'app-articles-admin',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		NgxEditorModule,
	],
	templateUrl: './articles-admin.component.html',
	styleUrl: './articles-admin.component.scss',
})
export class ArticlesAdminComponent implements OnInit, OnDestroy {
	private readonly educationAdminService = inject(EducationAdminService);
	private readonly userService = inject(UserService);

	readonly editor = new Editor();
	readonly toolbar: Toolbar = [
		['bold', 'italic', 'underline', 'strike'],
		['code', 'blockquote'],
		['ordered_list', 'bullet_list'],
		[{ heading: ['h1', 'h2', 'h3', 'h4'] }],
		['link', 'image'],
		['text_color', 'background_color'],
		['align_left', 'align_center', 'align_right', 'align_justify'],
		['horizontal_rule', 'format_clear'],
	];
	loading = false;
	errorMessage = '';
	searchTerm = '';
	statusFilter: 'ALL' | AdminEducationRecentArticle['status'] = 'ALL';
	categories: EducationCategory[] = [];
	showArticleForm = false;
	showLabelsPanel = false;
	formMode: 'create' | 'edit' = 'create';
	editingArticleId: string | null = null;
	showPreview = true;
	showAssessmentBuilder = false;
	assessmentArticleId: string | null = null;
	coverPreviewUrl: string | null = null;
	pendingCoverFile: File | null = null;
	newLabelName = '';
	savingLabel = false;
	deletingLabelId: string | null = null;
	uploadingCover = false;
	editorContent: Record<string, unknown> | null = null;
	previewAuthorName = 'Equipo Kidney Medicine';

	articleForm: {
		title: string;
		slug: string;
		summary: string;
		content: string;
		coverImageUrl: string;
		readingTimeMinutes: number | null;
		categoryId: string | null;
		requiresAssessment: boolean;
		requiresCertificate: boolean;
	} = {
		title: '',
		slug: '',
		summary: '',
		content: '',
		coverImageUrl: '',
		readingTimeMinutes: null,
		categoryId: null,
		requiresAssessment: true,
		requiresCertificate: true,
	};

	assessmentForm: CreateAssessmentPayload = {
		title: '',
		description: '',
		passingScore: 70,
		maxAttempts: 2,
		questions: [
			this.createEmptyQuestion(1),
			this.createEmptyQuestion(2),
			this.createEmptyQuestion(3),
		],
	};

	articlesState: PaginatedEducationArticles = {
		items: [],
		total: 0,
		page: 1,
		limit: 20,
	};

	dashboard: GetAdminEducationDashboardResponse = {
		summary: {
			totalArticles: 0,
			publishedArticles: 0,
			totalCertificates: 0,
		},
		recentArticles: [],
	};

	ngOnInit(): void {
		this.loadCurrentUserName();
		this.loadDashboard();
		this.loadCategories();
		this.loadArticles();
	}

	ngOnDestroy(): void {
		this.editor.destroy();
	}

	get rows(): EducationArticleItem[] {
		return this.articlesState.items.filter((article) => {
			const statusMatch =
				this.statusFilter === 'ALL' || article.status === this.statusFilter;

			if (!statusMatch) {
				return false;
			}

			const search = this.searchTerm.trim().toLowerCase();
			if (!search.length) {
				return true;
			}

			const haystack =
				`${article.title} ${article.categoryName ?? ''} ${article.authorName ?? ''} ${article.summary ?? ''}`.toLowerCase();
			return haystack.includes(search);
		});
	}

	onSearchChange(value: string): void {
		this.searchTerm = value;
		this.loadArticles();
	}

	onStatusChange(value: 'ALL' | AdminEducationRecentArticle['status']): void {
		this.statusFilter = value;
		this.loadArticles();
	}

	trackByRow(_: number, row: EducationArticleItem): string {
		return row.id;
	}

	getCategoryLabel(row: EducationArticleItem): string {
		return row.categoryName ?? 'Sin categoria';
	}

	getAuthorLabel(row: EducationArticleItem): string {
		const fullName = row.authorName?.trim();
		if (!fullName) {
			return 'Autor no disponible';
		}

		const parts = fullName.split(/\s+/).filter(Boolean);
		if (parts.length === 1) {
			return parts[0];
		}

		return `${parts[0]} ${parts[parts.length - 1]}`;
	}

	getDateLabel(row: EducationArticleItem): string {
		const sourceDate = row.publishedAt ?? row.createdAt;
		return formatColombiaDate(sourceDate);
	}

	get previewCategoryName(): string {
		if (!this.articleForm.categoryId) {
			return 'Sin categoria';
		}

		const category = this.categories.find(
			(item) => item.id === this.articleForm.categoryId,
		);

		return category?.name ?? 'Sin categoria';
	}

	get previewReadingTime(): number {
		return this.articleForm.readingTimeMinutes ?? 10;
	}

	get previewStatusLabel(): string {
		return this.formMode === 'create' ? 'Borrador' : 'Vista previa';
	}

	createArticle(): void {
		this.formMode = 'create';
		this.editingArticleId = null;
		this.showArticleForm = true;
		this.showPreview = false;
		this.clearLocalCoverPreview();
		this.resetArticleForm();
		this.resetAssessmentForm();
		this.editorContent = null;
	}

	onTitleChange(value: string): void {
		this.articleForm.title = value;
		if (this.formMode === 'create') {
			this.articleForm.slug = this.toSlug(value);
		}
	}

	saveArticle(publishAfterSave = false): void {
		if (!this.articleForm.title.trim() || !this.articleForm.slug.trim()) {
			this.errorMessage = 'Titulo y slug son obligatorios.';
			return;
		}

		if (this.pendingCoverFile) {
			this.uploadingCover = true;
			this.educationAdminService
				.uploadCoverImage(this.pendingCoverFile)
				.subscribe({
					next: (response) => {
						this.uploadingCover = false;
						const uploadedCoverUrl = this.toAbsoluteUploadUrl(response.url);
						this.articleForm.coverImageUrl = uploadedCoverUrl;
						this.pendingCoverFile = null;
						this.clearLocalCoverPreview();
						this.persistArticle(publishAfterSave);
					},
					error: () => {
						this.uploadingCover = false;
						this.errorMessage = 'No fue posible subir la imagen de portada.';
					},
				});
			return;
		}

		this.persistArticle(publishAfterSave);
	}

	private persistArticle(publishAfterSave: boolean): void {
		const rawEditorHtml = this.editorContent
			? toHTML(this.editorContent, this.editor.schema)
			: this.articleForm.content;

		const payload: CreateArticlePayload = {
			title: this.articleForm.title.trim(),
			slug: this.articleForm.slug.trim(),
			summary: this.articleForm.summary.trim() || null,
			content: (rawEditorHtml || '').trim() || null,
			coverImageUrl: this.articleForm.coverImageUrl.trim() || null,
			readingTimeMinutes: this.articleForm.readingTimeMinutes ?? null,
			categoryId: this.articleForm.categoryId,
			requiresAssessment: this.articleForm.requiresAssessment,
			requiresCertificate: this.articleForm.requiresCertificate,
		};

		this.loading = true;
		const request$ =
			this.formMode === 'create' || !this.editingArticleId
				? this.educationAdminService.createArticle(payload)
				: this.educationAdminService.updateArticle(
						this.editingArticleId,
						payload,
					);

		request$.subscribe({
			next: (savedArticle) => {
				const shouldCreateAssessment =
					this.formMode === 'create' &&
					this.articleForm.requiresAssessment &&
					this.isAssessmentFormFilled();

				if (shouldCreateAssessment) {
					this.educationAdminService
						.createAssessment(savedArticle.id, this.assessmentForm)
						.subscribe({
							next: () => {
								this.finalizeArticleSave(savedArticle.id, publishAfterSave);
							},
							error: () => {
								this.loading = false;
								this.errorMessage =
									'El articulo se guardo, pero no fue posible guardar la evaluación.';
							},
						});
					return;
				}

				this.finalizeArticleSave(savedArticle.id, publishAfterSave);
			},
			error: () => {
				this.loading = false;
				this.errorMessage =
					this.formMode === 'create'
						? 'No fue posible crear el articulo.'
						: 'No fue posible actualizar el articulo.';
			},
		});
	}

	private finalizeArticleSave(
		articleId: string,
		publishAfterSave: boolean,
	): void {
		if (!publishAfterSave) {
			this.showArticleForm = false;
			this.loadArticles();
			this.loadDashboard();
			return;
		}

		this.educationAdminService.publishArticle(articleId).subscribe({
			next: () => {
				this.showArticleForm = false;
				this.loadArticles();
				this.loadDashboard();
			},
			error: () => {
				this.loading = false;
				this.errorMessage = 'El articulo se guardo, pero no se pudo publicar.';
			},
		});
	}

	editArticle(row: EducationArticleItem): void {
		this.formMode = 'edit';
		this.editingArticleId = row.id;
		this.previewAuthorName = this.getAuthorLabel(row);
		this.showArticleForm = true;
		this.showPreview = false;
		this.clearLocalCoverPreview();
		this.articleForm = {
			title: row.title,
			slug: row.slug,
			summary: row.summary ?? '',
			content: row.content ?? '',
			coverImageUrl: row.coverImageUrl ?? '',
			readingTimeMinutes: row.readingTimeMinutes,
			categoryId: row.categoryId,
			requiresAssessment: row.requiresAssessment,
			requiresCertificate: row.requiresCertificate,
		};
		this.resetAssessmentForm();
		setTimeout(() => {
			this.editor.setContent(row.content ?? '');
		}, 0);
	}

	openLabelsPanel(): void {
		this.showLabelsPanel = !this.showLabelsPanel;
	}

	createLabel(): void {
		const name = this.newLabelName.trim();
		if (!name) {
			return;
		}

		this.savingLabel = true;
		this.educationAdminService.createCategory(name).subscribe({
			next: () => {
				this.newLabelName = '';
				this.savingLabel = false;
				this.loadCategories();
			},
			error: () => {
				this.savingLabel = false;
				this.errorMessage = 'No fue posible crear la etiqueta.';
			},
		});
	}

	deleteLabel(category: EducationCategory): void {
		const ok = window.confirm(
			`Se eliminara la etiqueta "${category.name}". Desea continuar?`,
		);
		if (!ok) {
			return;
		}

		this.deletingLabelId = category.id;
		this.educationAdminService.deleteCategory(category.id).subscribe({
			next: () => {
				this.deletingLabelId = null;
				if (this.articleForm.categoryId === category.id) {
					this.articleForm.categoryId = null;
				}
				this.loadCategories();
			},
			error: () => {
				this.deletingLabelId = null;
				this.errorMessage = 'No fue posible eliminar la etiqueta.';
			},
		});
	}

	onCoverFileSelected(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			return;
		}

		this.pendingCoverFile = file;
		this.clearLocalCoverPreview();
		this.coverPreviewUrl = URL.createObjectURL(file);
		input.value = '';
	}

	onCoverUrlChange(value: string): void {
		this.articleForm.coverImageUrl = value;
		if (value.trim()) {
			this.pendingCoverFile = null;
			this.clearLocalCoverPreview();
		}
	}

	publishArticle(row: EducationArticleItem): void {
		this.loading = true;
		this.educationAdminService.publishArticle(row.id).subscribe({
			next: () => {
				this.loadArticles();
				this.loadDashboard();
			},
			error: () => {
				this.loading = false;
				this.errorMessage = 'No fue posible publicar el articulo.';
			},
		});
	}

	deleteArticle(row: EducationArticleItem): void {
		const ok = window.confirm(
			`Se eliminara el articulo "${row.title}". Desea continuar?`,
		);
		if (!ok) {
			return;
		}

		this.loading = true;
		this.educationAdminService.deleteArticle(row.id).subscribe({
			next: () => {
				this.loadArticles();
				this.loadDashboard();
			},
			error: () => {
				this.loading = false;
				this.errorMessage = 'No fue posible eliminar el articulo.';
			},
		});
	}

	createQuickAssessment(row: EducationArticleItem): void {
		this.showAssessmentBuilder = true;
		this.assessmentArticleId = row.id;
		this.assessmentForm = {
			title: `Evaluacion - ${row.title}`,
			description: 'Evaluacion de 3 preguntas',
			passingScore: 70,
			maxAttempts: 2,
			questions: [
				this.createEmptyQuestion(1),
				this.createEmptyQuestion(2),
				this.createEmptyQuestion(3),
			],
		};
	}

	getSelectedCorrectOptionIndex(question: {
		options: Array<{ isCorrect: boolean }>;
	}): number | null {
		const selectedIndex = question.options.findIndex(
			(option) => option.isCorrect,
		);
		return selectedIndex >= 0 ? selectedIndex : null;
	}

	onSelectCorrectOption(
		question: {
			options: Array<{ isCorrect: boolean }>;
		},
		selectedIndex: number,
	): void {
		question.options = question.options.map((option, index) => ({
			...option,
			isCorrect: index === selectedIndex,
		}));
	}

	saveAssessment(): void {
		if (!this.assessmentArticleId) {
			return;
		}

		const invalidQuestion = this.assessmentForm.questions.find(
			(question) =>
				!question.questionText.trim() ||
				!question.options.some((option) => option.isCorrect) ||
				question.options.some((option) => !option.optionText.trim()),
		);

		if (invalidQuestion) {
			this.errorMessage =
				'Cada pregunta debe tener texto, opciones completas y al menos una opción correcta.';
			return;
		}

		this.loading = true;
		this.educationAdminService
			.createAssessment(this.assessmentArticleId, this.assessmentForm)
			.subscribe({
				next: () => {
					this.showAssessmentBuilder = false;
					this.loading = false;
				},
				error: () => {
					this.loading = false;
					this.errorMessage = 'No fue posible crear la evaluacion.';
				},
			});
	}

	cancelArticleForm(): void {
		this.showArticleForm = false;
		this.editingArticleId = null;
		this.showPreview = true;
		this.pendingCoverFile = null;
		this.clearLocalCoverPreview();
	}

	togglePreview(): void {
		this.showPreview = !this.showPreview;
	}

	get resolvedCoverPreviewUrl(): string {
		return this.coverPreviewUrl ?? this.articleForm.coverImageUrl;
	}

	get previewContentHtml(): string {
		const rawEditorHtml = this.editorContent
			? toHTML(this.editorContent, this.editor.schema)
			: this.articleForm.content;

		return (rawEditorHtml || '').trim();
	}

	cancelAssessmentBuilder(): void {
		this.showAssessmentBuilder = false;
		this.assessmentArticleId = null;
	}

	getStatusLabel(status: AdminEducationRecentArticle['status']): string {
		switch (status) {
			case 'DRAFT':
				return 'Borrador';
			case 'REVIEW':
				return 'Revision';
			case 'ARCHIVED':
				return 'Archivado';
			default:
				return 'Publicado';
		}
	}

	getStatusClass(status: AdminEducationRecentArticle['status']): string {
		switch (status) {
			case 'DRAFT':
				return 'badge bg-amber-50 text-amber-700 border-amber-100 inline-flex items-center gap-1';
			case 'REVIEW':
				return 'badge bg-blue-50 text-blue-700 border-blue-100 inline-flex items-center gap-1';
			case 'ARCHIVED':
				return 'badge bg-slate-100 text-slate-600 border-slate-200 inline-flex items-center gap-1';
			default:
				return 'badge bg-green-50 text-green-700 border-green-100 inline-flex items-center gap-1';
		}
	}

	private loadDashboard(): void {
		this.loading = true;
		this.errorMessage = '';

		this.educationAdminService.getAdminDashboard(20).subscribe({
			next: (response) => {
				this.dashboard = response;
				this.loading = false;
			},
			error: () => {
				this.errorMessage =
					'No fue posible cargar los articulos educativos en este momento.';
				this.dashboard = {
					summary: {
						totalArticles: 0,
						publishedArticles: 0,
						totalCertificates: 0,
					},
					recentArticles: [],
				};
				this.loading = false;
			},
		});
	}

	private loadCategories(): void {
		this.educationAdminService.getCategories().subscribe({
			next: (categories) => {
				this.categories = categories;
			},
			error: () => {
				this.categories = [];
			},
		});
	}

	private loadArticles(): void {
		this.loading = true;
		this.errorMessage = '';

		this.educationAdminService
			.getArticles({
				page: 1,
				limit: 50,
				status: this.statusFilter === 'ALL' ? undefined : this.statusFilter,
				search: this.searchTerm,
			})
			.subscribe({
				next: (response) => {
					this.articlesState = response;
					this.loading = false;
				},
				error: () => {
					this.articlesState = {
						items: [],
						total: 0,
						page: 1,
						limit: 20,
					};
					this.loading = false;
					this.errorMessage =
						'No fue posible cargar los articulos educativos en este momento.';
				},
			});
	}

	private loadCurrentUserName(): void {
		this.userService.getCurrentUser().subscribe({
			next: (user) => {
				const firstName = (user.firstName ?? '').trim();
				const lastName = (user.lastName ?? '').trim();
				const fullName = `${firstName} ${lastName}`.trim();
				if (fullName) {
					this.previewAuthorName = fullName;
				}
			},
			error: () => {
				this.previewAuthorName = 'Equipo Kidney Medicine';
			},
		});
	}

	private toSlug(value: string): string {
		return value
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.trim()
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');
	}

	private resetArticleForm(): void {
		this.articleForm = {
			title: '',
			slug: '',
			summary: '',
			content: '',
			coverImageUrl: '',
			readingTimeMinutes: null,
			categoryId: null,
			requiresAssessment: true,
			requiresCertificate: true,
		};
		this.pendingCoverFile = null;
		this.clearLocalCoverPreview();
	}

	private clearLocalCoverPreview(): void {
		if (this.coverPreviewUrl) {
			URL.revokeObjectURL(this.coverPreviewUrl);
		}
		this.coverPreviewUrl = null;
	}

	private isAssessmentFormFilled(): boolean {
		return this.assessmentForm.questions.every(
			(q) =>
				q.questionText.trim().length >= 5 &&
				q.options.every((o) => o.optionText.trim().length >= 1),
		);
	}

	private resetAssessmentForm(): void {
		this.assessmentForm = {
			title: '',
			description: '',
			passingScore: 70,
			maxAttempts: 2,
			questions: [
				this.createEmptyQuestion(1),
				this.createEmptyQuestion(2),
				this.createEmptyQuestion(3),
			],
		};
	}

	private toAbsoluteUploadUrl(url: string): string {
		if (url.startsWith('http://') || url.startsWith('https://')) {
			return url;
		}

		const base = this.educationAdminService.getApiBaseUrl();
		return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
	}

	private createEmptyQuestion(orderIndex: number): {
		questionText: string;
		questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE';
		points?: number;
		orderIndex?: number;
		options: Array<{
			optionText: string;
			isCorrect: boolean;
			orderIndex?: number;
		}>;
	} {
		return {
			questionText: '',
			questionType: 'SINGLE_CHOICE',
			orderIndex,
			points: 1,
			options: [
				{ optionText: '', isCorrect: true, orderIndex: 1 },
				{ optionText: '', isCorrect: false, orderIndex: 2 },
				{ optionText: '', isCorrect: false, orderIndex: 3 },
			],
		};
	}
}
