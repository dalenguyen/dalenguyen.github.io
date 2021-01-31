import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MapService } from '../services/map.service';
@Component({
  selector: 'app-mapbox',
  templateUrl: './mapbox.component.html',
  styleUrls: ['./mapbox.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapboxComponent implements OnInit {

  constructor(private mapService: MapService) { }

  ngOnInit(): void {
    this.mapService.initializeMap()
  }

}
