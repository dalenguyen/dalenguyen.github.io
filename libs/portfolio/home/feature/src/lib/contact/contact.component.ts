import { ChangeDetectionStrategy, Component } from '@angular/core'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dalenguyen-contact',
  standalone: true,
  templateUrl: './contact.component.html',
})
export class ContactComponent {}
