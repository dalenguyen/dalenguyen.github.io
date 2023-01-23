import { Component, Input } from '@angular/core'

@Component({
  selector: 'dalenguyen-country-detail',
  templateUrl: './country-detail.component.html',
  styleUrls: ['./country-detail.component.scss'],
})
export class CountryDetailComponent {
  @Input() content: string

  constructor() {}
}
