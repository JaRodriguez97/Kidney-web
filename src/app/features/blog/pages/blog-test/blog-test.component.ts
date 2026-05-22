import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
	ArticleAssessment,
	BlogService,
	CertificateData,
	SubmitAssessmentResult,
} from '@app/core/services/blog.service';
import { FormsModule } from '@angular/forms';
import { PlatformService } from '@app/shared/services/platform.service';

@Component({
	selector: 'app-blog-test',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterLink],
	templateUrl: './blog-test.component.html',
	styleUrl: './blog-test.component.scss',
})
export class BlogTestComponent {
	constructor(
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		private readonly blogService: BlogService,
		private readonly platformService: PlatformService,
	) {}

	loading = false;
	errorMessage = '';
	assessment: ArticleAssessment | null = null;
	selectedOptions: Record<string, string> = {};
	result: SubmitAssessmentResult | null = null;
	certificate: CertificateData | null = null;
	showCertificatePreview = false;

	ngOnInit(): void {
		if (!this.platformService.getIsBrowser()) {
			return;
		}

		if (!this.platformService.getLocalStorageItem('accessToken')) {
			const articleId = this.route.snapshot.paramMap.get('id');
			const returnUrl = articleId ? `/blog/test/${articleId}` : '/blog';
			this.router.navigate(['/login/patient'], {
				queryParams: { returnUrl },
			});
			return;
		}

		this.loadAssessment();
	}

	selectOption(questionId: string, optionId: string): void {
		this.selectedOptions[questionId] = optionId;
	}

	isSelected(questionId: string, optionId: string): boolean {
		return this.selectedOptions[questionId] === optionId;
	}

	get canSubmit(): boolean {
		if (!this.assessment) {
			return false;
		}

		return this.assessment.questions.every((q) =>
			Boolean(this.selectedOptions[q.id]),
		);
	}

	submit(): void {
		if (!this.assessment || !this.canSubmit) {
			return;
		}

		this.loading = true;
		this.errorMessage = '';

		const answers = this.assessment.questions.map((q) => ({
			questionId: q.id,
			selectedOptionId: this.selectedOptions[q.id],
		}));

		this.blogService
			.submitAssessment({
				assessmentId: this.assessment.id,
				answers,
			})
			.subscribe({
				next: (result) => {
					this.result = result;
					this.certificate = result.certificate;
					this.loading = false;
					if (result.passed && !result.certificate) {
						this.fetchCertificate(result.articleId);
					}
				},
				error: () => {
					this.loading = false;
					this.errorMessage = 'No fue posible enviar la evaluación.';
				},
			});
	}

	printCertificate(): void {
		if (!this.platformService.getIsBrowser()) {
			return;
		}

		if (!this.certificate?.renderedHtml) {
			return;
		}

		const popup = window.open('', '_blank', 'width=900,height=700');
		if (!popup) {
			return;
		}

		popup.document.write(this.certificate.renderedHtml);
		popup.document.close();
		popup.focus();
		popup.print();
	}

	toggleCertificatePreview(): void {
		this.showCertificatePreview = !this.showCertificatePreview;
	}

	private loadAssessment(): void {
		const articleId = this.route.snapshot.paramMap.get('id');
		if (!articleId) {
			this.errorMessage = 'No se encontró el artículo para evaluar.';
			return;
		}

		this.loading = true;
		this.blogService.getAssessment(articleId).subscribe({
			next: (assessment) => {
				this.assessment = assessment;
				this.loading = false;
			},
			error: () => {
				this.loading = false;
				this.errorMessage = 'No fue posible cargar la evaluación.';
			},
		});
	}

	private fetchCertificate(articleId: string): void {
		this.blogService.getCertificate(articleId).subscribe({
			next: (certificate) => {
				this.certificate = certificate;
			},
		});
	}
}
