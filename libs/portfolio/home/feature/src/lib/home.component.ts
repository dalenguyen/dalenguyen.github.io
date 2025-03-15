import { ChangeDetectionStrategy, Component } from '@angular/core'
import { BiographyComponent } from './biography/biography.component'
import { ContactComponent } from './contact/contact.component'
import { IntroComponent } from './intro/intro.component'
import { PortfolioComponent } from './portfolio/portfolio.component'
import { PublicationComponent } from './publication/publication.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-home',
  imports: [ContactComponent, BiographyComponent, PortfolioComponent, IntroComponent, PublicationComponent],
  template: `
    <dalenguyen-intro />
    <dalenguyen-publication />
    <dalenguyen-portfolio />
    <dalenguyen-biography />
    <dalenguyen-contact />
  `,
})
export class HomeComponent {}
