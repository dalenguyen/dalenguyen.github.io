import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-biography',
  standalone: true,
  templateUrl: './biography.component.html',
  styleUrls: ['./biography.component.scss'],
})
export class BiographyComponent {}
