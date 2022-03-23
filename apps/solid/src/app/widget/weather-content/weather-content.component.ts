import { Component } from '@angular/core'
import { Reloadable, WidgetContent } from '../widget-content'
import { RELOADABLE_CONTENT } from '../widget-content.token'

@Component({
  selector: 'dalenguyen-weather-content',
  templateUrl: './weather-content.component.html',
  styleUrls: ['./weather-content.component.scss'],
  // Assign component instance to the token
  providers: [{ provide: RELOADABLE_CONTENT, useExisting: WeatherContentComponent }],
})
export class WeatherContentComponent implements WidgetContent, Reloadable {
  id: string = ''
  loading: boolean = false
  reload(): void {
    console.log('Reload weather...')
  }
}
