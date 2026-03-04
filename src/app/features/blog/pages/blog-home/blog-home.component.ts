import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '@layout/public/navbar/navbar.component';
import { FooterComponent } from '@layout/public/footer/footer.component';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterModule],
  templateUrl: './blog-home.component.html',
  styleUrl: './blog-home.component.scss',
})
export class BlogHomeComponent implements AfterViewInit {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // solo se ejecuta en navegador
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }
}
