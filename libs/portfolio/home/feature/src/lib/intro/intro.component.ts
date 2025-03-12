import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NavService } from '@dalenguyen/portfolio/shell/ui'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NavService],
  selector: 'dalenguyen-intro',
  standalone: true,
  templateUrl: './intro.component.html',
})
export class IntroComponent {
  protected readonly navService = inject(NavService)
}
