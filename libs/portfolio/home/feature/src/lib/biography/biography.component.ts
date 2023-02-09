import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-biography',
  standalone: true,
  templateUrl: './biography.component.html',
})
export class BiographyComponent {}
