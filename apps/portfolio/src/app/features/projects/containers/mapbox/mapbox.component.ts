import { Component, OnInit, ViewEncapsulation } from '@angular/core'
import { Observable } from 'rxjs'
import { MapService } from '../../services/map.service'

@Component({
  selector: 'dalenguyen-mapbox',
  templateUrl: './mapbox.component.html',
  styleUrls: ['./mapbox.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MapboxComponent implements OnInit {
  content$: Observable<string>

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    this.mapService.initializeMap()
    this.content$ = this.mapService.countryDetail$
  }
}
