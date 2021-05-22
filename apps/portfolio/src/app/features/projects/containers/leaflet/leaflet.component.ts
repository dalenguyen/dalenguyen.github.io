import { Component, OnInit, ViewEncapsulation } from '@angular/core'
import { environment } from 'apps/portfolio/src/environments/environment'
import L, { icon } from 'leaflet'

@Component({
  selector: 'app-leaflet',
  templateUrl: './leaflet.component.html',
  styleUrls: ['./leaflet.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LeafletComponent implements OnInit {
  myMap: L.Map
  popup: L.Popup

  constructor() {}

  ngOnInit(): void {
    this.myMap = L.map('mapid').setView([43.76109381775651, -79.365234375], 10)

    // https://leaflet-extras.github.io/leaflet-providers/preview/
    // https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox/streets-v11',
      tileSize: 512,
      zoomOffset: -1,
      accessToken: environment.mapbox.accessToken,
    }).addTo(this.myMap)

    // Bind map event

    this.myMap.on('click', this.onMapClick)

    this.myMap.on('load', () => {
      this.popup = L.popup()
    })

    const marker = L.marker([43.67, -79.366], {
      icon: icon({
        iconSize: [25, 41],
        iconAnchor: [13, 41],
        iconUrl: 'leaflet/marker-icon.png',
        shadowUrl: 'leaflet/marker-shadow.png',
      }),
    }).addTo(this.myMap)

    const circle = L.circle([43.77, -79.365], {
      color: '#fff',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 1000,
    }).addTo(this.myMap)

    const polygon = L.polygon([
      [43.86, -79.366],
      [43.87, -79.597],
      [43.78, -79.378],
    ]).addTo(this.myMap)

    marker.bindPopup('<b>Hello world!</b><br>I am a popup.')
    // .openPopup();
    circle.bindPopup('I am a circle.')
    polygon.bindPopup('I am a polygon.')

    // var popup = L.popup()
    //   .setLatLng([51.5, -0.09])
    //   .setContent("I am a standalone popup.")
    //   .openOn(this.myMap);
  }

  onMapClick(e) {
    // alert("You clicked the map at " + e.latlng);
    // console.log(this.popup);
    // this.popup = L.popup()
    // this.popup
    //     .setLatLng(e.latlng)
    //     .setContent("You clicked the map at " + e.latlng.toString())
    //     .openOn(this.myMap);
  }
}
