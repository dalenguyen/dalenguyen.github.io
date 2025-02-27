import { ChangeDetectionStrategy, Component } from '@angular/core'
import { BiographyComponent } from './biography/biography.component'
import { ContactComponent } from './contact/contact.component'
import { IntroComponent } from './intro/intro.component'
import { PortfolioComponent } from './portfolio/portfolio.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-home',
  imports: [ContactComponent, BiographyComponent, PortfolioComponent, IntroComponent],
  template: `
    <dalenguyen-intro />
    <dalenguyen-portfolio />
    <dalenguyen-biography />
    <dalenguyen-contact />
  `,
})
export class HomeComponent {}
