import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BlogService, EducationArticle } from '@app/core/services/blog.service';
import { PlatformService } from '@app/shared/services/platform.service';

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './education.component.html',
  styleUrl: './education.component.scss',
})
export class EducationComponent implements OnInit {
  constructor(
    private readonly blogService: BlogService,
    private readonly platformService: PlatformService,
  ) {}

  loading = false;
  articles: EducationArticle[] = [];

  ngOnInit(): void {
    if (!this.platformService.getIsBrowser()) {
      return;
    }

    this.loadArticles();
  }

  private loadArticles(): void {
    this.loading = true;

    this.blogService.getPublishedArticles(1, 3).subscribe({
      next: (result) => {
        this.articles = result.items;
        this.loading = false;
      },
      error: () => {
        this.articles = [];
        this.loading = false;
      },
    });
  }
}
