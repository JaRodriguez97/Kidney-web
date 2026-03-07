import { AfterViewInit, Component, HostListener } from '@angular/core';
import { NavbarComponent } from '@app/layout/public/navbar/navbar.component';
import { FooterComponent } from '@app/layout/public/footer/footer.component';
import { RouterLink } from '@angular/router';
import { PlatformService } from '@app/shared/services/platform.service';

@Component({
  selector: 'app-blog-article',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterLink],
  templateUrl: './blog-article.component.html',
  styleUrl: './blog-article.component.scss',
})
export class BlogArticleComponent implements AfterViewInit {
  constructor(private platformService: PlatformService) {}

  ngAfterViewInit(): void {
    this.platformService.scrollToTop('auto');
  }

  scrollProgress = 0;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrollTop = this.platformService.getScrollPosition();
    const docHeight = this.platformService.getDocumentHeight();
    this.scrollProgress =
      docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
  }
}
