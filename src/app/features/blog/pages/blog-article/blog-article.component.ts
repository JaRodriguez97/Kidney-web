import {
	AfterViewInit,
	Component,
	HostListener,
	OnDestroy,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavbarComponent } from '@app/layout/public/navbar/navbar.component';
import { FooterComponent } from '@app/layout/public/footer/footer.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PlatformService } from '@app/shared/services/platform.service';
import { BlogService, EducationArticle } from '@app/core/services/blog.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-blog-article',
	standalone: true,
	imports: [CommonModule, NavbarComponent, FooterComponent, RouterLink],
	templateUrl: './blog-article.component.html',
	styleUrl: './blog-article.component.scss',
})
export class BlogArticleComponent implements AfterViewInit, OnDestroy {
	constructor(
		private platformService: PlatformService,
		private route: ActivatedRoute,
		private blogService: BlogService,
		private router: Router,
		private sanitizer: DomSanitizer,
	) {}

	loading = false;
	errorMessage = '';
	article: EducationArticle | null = null;
	safeContent: SafeHtml | null = null;
	canGoToTest = false;
	requiredTimeSeconds = 0;
	elapsedTimeSeconds = 0;
	private timeOffsetSeconds = 0;
	private accessLogId: string | null = null;
	private startedAtMs = 0;
	private currentTrackedProgress = 0;
	private readonly subs = new Subscription();
	private readonly localProgressKeyPrefix = 'blog-progress:';

	ngAfterViewInit(): void {
		this.platformService.scrollToTop('auto');
		if (this.platformService.getIsBrowser()) {
			this.loadArticle();
		}
	}

	ngOnDestroy(): void {
		this.closeReadingAccess();
		this.subs.unsubscribe();
	}

	scrollProgress = 0;

	@HostListener('window:scroll')
	onWindowScroll(): void {
		if (!this.platformService.getIsBrowser()) {
			return;
		}

		const scrollTop = this.platformService.getScrollPosition();
		const docHeight = this.platformService.getDocumentHeight();
		this.scrollProgress =
			docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

		if (!this.article?.id) {
			return;
		}

		if (
			this.scrollProgress - this.currentTrackedProgress >= 10 ||
			this.scrollProgress === 100
		) {
			this.currentTrackedProgress = this.scrollProgress;
			this.trackProgress();
		}

		this.updateAssessmentAccess();
	}

	private loadArticle(): void {
		const slug = this.route.snapshot.paramMap.get('id');
		if (!slug) {
			this.errorMessage = 'Artículo no encontrado.';
			return;
		}

		this.loading = true;
		this.errorMessage = '';

		const sub = this.blogService.getArticleBySlug(slug).subscribe({
			next: (article) => {
				this.article = article;
				this.safeContent = this.sanitizer.bypassSecurityTrustHtml(
					article.content ?? '',
				);
				this.requiredTimeSeconds = (article.readingTimeMinutes ?? 0) * 60;
				this.elapsedTimeSeconds = 0;
				this.timeOffsetSeconds = 0;
				this.startedAtMs = Date.now();
				this.restoreLocalProgress();
				this.updateAssessmentAccess();
				this.loading = false;
				if (this.isAuthenticated()) {
					this.startReadingAccess();
				}
			},
			error: () => {
				this.errorMessage = 'No fue posible cargar el artículo.';
				this.loading = false;
			},
		});
		this.subs.add(sub);
	}

	private startReadingAccess(): void {
		if (!this.article?.id) {
			return;
		}

		this.startedAtMs = Date.now();
		const sub = this.blogService.startAccess(this.article.id).subscribe({
			next: (session) => {
				this.accessLogId = session.id;
			},
			error: () => {
				this.accessLogId = null;
			},
		});
		this.subs.add(sub);
	}

	private trackProgress(): void {
		if (!this.article?.id) {
			return;
		}

		const totalTimeSeconds = Math.max(
			0,
			this.timeOffsetSeconds + Math.round((Date.now() - this.startedAtMs) / 1000),
		);
		this.elapsedTimeSeconds = totalTimeSeconds;
		this.updateAssessmentAccess();

		if (!this.isAuthenticated()) {
			this.persistLocalProgress({
				progressPercentage: this.scrollProgress,
				lastPosition: this.platformService.getScrollPosition(),
				totalTimeSeconds,
			});
			return;
		}

		const sub = this.blogService
			.trackProgress(this.article.id, {
				progressPercentage: this.scrollProgress,
				lastPosition: this.platformService.getScrollPosition(),
				totalTimeSeconds,
			})
			.subscribe({
				next: (progress) => {
					this.elapsedTimeSeconds = progress.totalTimeSeconds;
					this.updateAssessmentAccess();
				},
			});
		this.subs.add(sub);
	}

	get timeRemainingMinutes(): number {
		const pendingSeconds = Math.max(
			0,
			this.requiredTimeSeconds - this.elapsedTimeSeconds,
		);

		return Math.ceil(pendingSeconds / 60);
	}

	get requiresReadingTimeGate(): boolean {
		return this.requiredTimeSeconds > 0;
	}

	private updateAssessmentAccess(): void {
		if (!this.article?.requiresAssessment) {
			this.canGoToTest = false;
			return;
		}

		const hasScrollProgress = this.scrollProgress >= 90;
		const hasRequiredTime =
			!this.requiresReadingTimeGate ||
			this.elapsedTimeSeconds >= this.requiredTimeSeconds;

		this.canGoToTest = hasScrollProgress && hasRequiredTime;
	}

	private closeReadingAccess(): void {
		if (!this.isAuthenticated()) {
			return;
		}

		if (!this.accessLogId) {
			return;
		}

		const durationSeconds = Math.max(
			0,
			Math.round((Date.now() - this.startedAtMs) / 1000),
		);
		const sub = this.blogService
			.closeAccess({
				accessLogId: this.accessLogId,
				durationSeconds,
				maxScrollPercentage: this.scrollProgress,
			})
			.subscribe();
		this.subs.add(sub);
	}

	goToAssessment(): void {
		if (!this.article?.id) {
			return;
		}

		if (!this.isAuthenticated()) {
			const returnUrl = `/blog/test/${this.article.id}`;
			this.router.navigate(['/login/patient'], {
				queryParams: { returnUrl },
			});
			return;
		}

		this.router.navigate(['/blog/test', this.article.id]);
	}

	private isAuthenticated(): boolean {
		return Boolean(this.platformService.getLocalStorageItem('accessToken'));
	}

	private getLocalProgressKey(): string | null {
		if (!this.article?.id) {
			return null;
		}

		return `${this.localProgressKeyPrefix}${this.article.id}`;
	}

	private persistLocalProgress(payload: {
		progressPercentage: number;
		lastPosition: number;
		totalTimeSeconds: number;
	}): void {
		const key = this.getLocalProgressKey();
		if (!key) {
			return;
		}

		this.platformService.setLocalStorageItem(key, JSON.stringify(payload));
	}

	private restoreLocalProgress(): void {
		const key = this.getLocalProgressKey();
		if (!key) {
			return;
		}

		const raw = this.platformService.getLocalStorageItem(key);
		if (!raw) {
			return;
		}

		try {
			const parsed = JSON.parse(raw) as {
				progressPercentage?: number;
				lastPosition?: number;
				totalTimeSeconds?: number;
			};
			this.scrollProgress = Math.max(
				0,
				Math.min(100, parsed.progressPercentage || 0),
			);
			this.currentTrackedProgress = this.scrollProgress;
			this.elapsedTimeSeconds = Math.max(0, parsed.totalTimeSeconds || 0);
			this.timeOffsetSeconds = this.elapsedTimeSeconds;
			this.updateAssessmentAccess();

			if (
				this.platformService.getIsBrowser() &&
				(parsed.lastPosition || 0) > 0
			) {
				setTimeout(
					() => this.platformService.scrollTo(parsed.lastPosition || 0),
					50,
				);
			}
		} catch {
			this.platformService.removeLocalStorageItem(key);
		}
	}
}
