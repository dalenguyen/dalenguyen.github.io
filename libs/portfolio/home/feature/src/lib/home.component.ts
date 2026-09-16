import { ChangeDetectionStrategy, Component } from '@angular/core'
import { SeasonDecorComponent } from '@dalenguyen/portfolio/shell/ui'
import { BiographyComponent } from './biography/biography.component'
import { ContactComponent } from './contact/contact.component'
import { IntroComponent } from './intro/intro.component'
import { PortfolioComponent } from './portfolio/portfolio.component'
import { PublicationComponent } from './publication/publication.component'
import { RecentPostsComponent } from './recent-posts/recent-posts.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-home',
  imports: [
    SeasonDecorComponent,
    ContactComponent,
    BiographyComponent,
    PortfolioComponent,
    IntroComponent,
    PublicationComponent,
    RecentPostsComponent,
  ],
  template: `
    <!-- Seasonal ambience. Renders nothing out of season; each season's
         artwork is a lazy chunk. See libs/portfolio/shell/ui/src/lib/season. -->
    <dalenguyen-season-decor />
    <dalenguyen-intro />
    <dalenguyen-publication />
    <dalenguyen-portfolio />
    <dalenguyen-recent-posts />
    <dalenguyen-biography />
    <dalenguyen-contact />
  `,
})
export class HomeComponent {}
