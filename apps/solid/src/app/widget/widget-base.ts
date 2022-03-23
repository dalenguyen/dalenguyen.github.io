import { Directive, Input } from '@angular/core'

// Liskov Substitution Principle
@Directive()
export class WidgetBase {
  @Input() title = 'Weather'
  onExportJson() {
    // this.jsonExporter.export()
    console.log('json')
  }
}
