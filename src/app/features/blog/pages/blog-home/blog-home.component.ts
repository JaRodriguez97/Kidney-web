import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '@layout/public/navbar/navbar.component';
import { FooterComponent } from '@layout/public/footer/footer.component';
import { PlatformService } from '@app/shared/services/platform.service';
import {
	BlogService,
	EducationArticle,
	EducationCategory,
} from '@app/core/services/blog.service';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

@Component({
	selector: 'app-blog-home',
	standalone: true,
	imports: [CommonModule, NavbarComponent, FooterComponent, RouterModule],
	templateUrl: './blog-home.component.html',
	styleUrl: './blog-home.component.scss',
})
export class BlogHomeComponent implements OnInit, AfterViewInit {
	constructor(
		private platformService: PlatformService,
		private blogService: BlogService,
	) {}

	loading = false;
	errorMessage = '';
	articles: EducationArticle[] = [];
	filteredArticles: EducationArticle[] = [];
	categories: EducationCategory[] = [];
	selectedCategoryId = 'ALL';

	ngOnInit(): void {
		if (this.platformService.getIsBrowser()) {
			this.loadArticles();
		}
	}

	ngAfterViewInit(): void {
		this.platformService.scrollToTop('auto');
	}

	private loadArticles(): void {
		this.loading = true;
		this.errorMessage = '';

		forkJoin({
			articles: this.blogService.getPublishedArticles(1, 20),
			categories: this.blogService.getCategories(),
		}).subscribe({
			next: ({ articles, categories }) => {
				this.articles = articles.items;
				this.categories = categories;
				this.applyFilter();
				this.loading = false;
			},
			error: () => {
				this.errorMessage =
					'No fue posible cargar los articulos educativos en este momento.';
				this.articles = [];
				this.categories = [];
				this.filteredArticles = [];
				this.loading = false;
			},
		});
	}

	selectCategory(categoryId: string): void {
		this.selectedCategoryId = categoryId;
		this.applyFilter();
	}

	private applyFilter(): void {
		if (this.selectedCategoryId === 'ALL') {
			this.filteredArticles = [...this.articles];
			return;
		}

		this.filteredArticles = this.articles.filter(
			(article) => article.categoryId === this.selectedCategoryId,
		);
	}
}
