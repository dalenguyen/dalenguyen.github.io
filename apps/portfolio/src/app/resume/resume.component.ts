import { ChangeDetectionStrategy, Component } from '@angular/core'
import { MatIconModule } from '@angular/material/icon'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resume',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './resume.component.html',
  styleUrls: ['./resume.component.scss'],
})
export class ResumeComponent {}
