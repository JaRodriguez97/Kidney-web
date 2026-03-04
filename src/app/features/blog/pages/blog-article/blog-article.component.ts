import {
  AfterViewInit,
  Component,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { NavbarComponent } from '@app/layout/public/navbar/navbar.component';
import { FooterComponent } from '@app/layout/public/footer/footer.component';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-blog-article',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterLink],
  templateUrl: './blog-article.component.html',
  styleUrl: './blog-article.component.scss',
})
export class BlogArticleComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // solo se ejecuta en navegador
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  scrollProgress = 0;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    this.scrollProgress =
      docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
  }
}
