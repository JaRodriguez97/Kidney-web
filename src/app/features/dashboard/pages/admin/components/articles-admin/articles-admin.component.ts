import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	AdminEducationRecentArticle,
	EducationAdminService,
	GetAdminEducationDashboardResponse,
} from '@app/core/services/education-admin.service';
import { formatColombiaDate } from '@app/shared/utils/colombia-date.utils';

@Component({
	selector: 'app-articles-admin',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './articles-admin.component.html',
	styleUrl: './articles-admin.component.scss',
})
export class ArticlesAdminComponent implements OnInit {
	private readonly educationAdminService = inject(EducationAdminService);

	loading = false;
	errorMessage = '';
	searchTerm = '';
	statusFilter: 'ALL' | AdminEducationRecentArticle['status'] = 'ALL';

	dashboard: GetAdminEducationDashboardResponse = {
		summary: {
			totalArticles: 0,
			publishedArticles: 0,
			totalCertificates: 0,
		},
		recentArticles: [],
	};

	ngOnInit(): void {
		this.loadDashboard();
	}

	get rows(): AdminEducationRecentArticle[] {
		return this.dashboard.recentArticles.filter((article) => {
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
	}

	onStatusChange(value: 'ALL' | AdminEducationRecentArticle['status']): void {
		this.statusFilter = value;
	}

	trackByRow(_: number, row: AdminEducationRecentArticle): string {
		return row.id;
	}

	getCategoryLabel(row: AdminEducationRecentArticle): string {
		return row.categoryName ?? 'Sin categoria';
	}

	getAuthorLabel(row: AdminEducationRecentArticle): string {
		return row.authorName ?? 'Autor no disponible';
	}

	getDateLabel(row: AdminEducationRecentArticle): string {
		const sourceDate = row.publishedAt ?? row.createdAt;
		return formatColombiaDate(sourceDate);
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
}
