import { Component } from '@angular/core';
import { NavbarComponent } from '../../../../layout/public/navbar/navbar.component';
import { HeroComponent } from '../../components/hero/hero.component';
import { CtaPrimaryComponent } from '../../components/cta-primary/cta-primary.component';
import { AboutKmComponent } from '../../components/about-km/about-km.component';
import { PortfolioComponent } from '../../components/portfolio/portfolio.component';
import { BenefitsComponent } from '../../components/benefits/benefits.component';
import { HighlightsComponent } from '../../components/highlights/highlights.component';
import { EducationComponent } from '../../components/education/education.component';
import { CtaSecondaryComponent } from '../../components/cta-secondary/cta-secondary.component';
import { FormContactComponent } from '../../components/form-contact/form-contact.component';
import { FooterComponent } from '../../../../layout/public/footer/footer.component';
import { AliadosComponent } from '../../components/aliados/aliados.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    NavbarComponent,
    HeroComponent,
    CtaPrimaryComponent,
    AboutKmComponent,
    PortfolioComponent,
    BenefitsComponent,
    HighlightsComponent,
    EducationComponent,
    CtaSecondaryComponent,
    FormContactComponent,
    FooterComponent,
    AliadosComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {}
