import { ChangeDetectionStrategy, Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-contact',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
})
export class ContactComponent {}
