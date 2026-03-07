import { Component, AfterViewInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '@layout/public/navbar/navbar.component';
import { FooterComponent } from '@layout/public/footer/footer.component';
import { PlatformService } from '@app/shared/services/platform.service';

@Component({
  selector: 'app-blog-home',
  standalone: true,
  imports: [NavbarComponent, FooterComponent, RouterModule],
  templateUrl: './blog-home.component.html',
  styleUrl: './blog-home.component.scss',
})
export class BlogHomeComponent implements AfterViewInit {
  constructor(private platformService: PlatformService) {}

  ngAfterViewInit(): void {
    this.platformService.scrollToTop('auto');
  }
}
