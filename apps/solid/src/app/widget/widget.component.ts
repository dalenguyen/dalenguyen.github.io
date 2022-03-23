import { Component, ContentChild } from '@angular/core'
import { WidgetBase } from './widget-base'
import { Reloadable } from './widget-content'
import { RELOADABLE_CONTENT } from './widget-content.token'

@Component({
  selector: 'dalenguyen-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss'],
})
// Liskov Substitution Principle
// WidgetComponent has @Input(): title without implementing it
// onExportJson() can be utilized without WidgetComponent knowing about its existing
export class WidgetComponent extends WidgetBase {
  // Dependency inversion principle
  // High-level modules should not depend on low-level modules.
  // @ContentChild(WeatherContentComponent) content: WeatherContentComponent
  @ContentChild(RELOADABLE_CONTENT) content?: Reloadable

  ngAfterViewInit(): void {
    this.content?.reload()
  }

  override onExportJson(): void {
    super.onExportJson()
    console.log('json other method')
  }
}
