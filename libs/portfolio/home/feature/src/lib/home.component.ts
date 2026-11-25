import { ChangeDetectionStrategy, Component } from '@angular/core'
import { SeasonDecorComponent } from '@dalenguyen/portfolio/shell/ui'
import { HelloComponent } from './chapters/hello.component'
import { HowIWorkComponent } from './chapters/how-i-work.component'
import { NowComponent } from './chapters/now.component'
import { ShipComponent } from './chapters/ship.component'
import { WritingComponent } from './chapters/writing.component'
import { ContactComponent } from './contact/contact.component'
import { HomeSceneComponent } from './scene/home-scene.component'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-home',
  imports: [
    SeasonDecorComponent,
    HomeSceneComponent,
    HelloComponent,
    ShipComponent,
    HowIWorkComponent,
    WritingComponent,
    NowComponent,
    ContactComponent,
  ],
  template: `
    <!-- Seasonal ambience. Renders nothing out of season; each season's
         artwork is a lazy chunk. See libs/portfolio/shell/ui/src/lib/season. -->
    <dalenguyen-season-decor />
    <!-- The page reads as six chapters. three.js particles sit behind it
         and morph into the shape each section names with data-scene
         (see ./scene). -->
    <dalenguyen-home-scene />
    <div class="relative z-10">
      <dalenguyen-hello />
      <dalenguyen-ship />
      <dalenguyen-how-i-work />
      <dalenguyen-writing />
      <dalenguyen-now />
      <dalenguyen-contact />
    </div>
  `,
})
export class HomeComponent {}
