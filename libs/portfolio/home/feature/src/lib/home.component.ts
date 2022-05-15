import { ChangeDetectionStrategy, Component } from '@angular/core'
import { BiographyComponent } from './biography/biography.component'
import { ContactComponent } from './contact/contact.component'
import { IntroComponent } from './intro/intro.component'
import { PortfolioComponent } from './portfolio/portfolio.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  standalone: true,
  imports: [ContactComponent, BiographyComponent, PortfolioComponent, IntroComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
