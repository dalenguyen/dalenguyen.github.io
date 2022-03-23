import { Component } from '@angular/core'
import { WidgetContent } from '../widget-content'

@Component({
  selector: 'dalenguyen-velocity-content',
  templateUrl: './velocity-content.component.html',
  styleUrls: ['./velocity-content.component.scss'],
})
export class VelocityContentComponent implements WidgetContent {
  id: string = ''
}
