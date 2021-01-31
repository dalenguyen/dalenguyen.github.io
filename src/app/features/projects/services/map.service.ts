import { Injectable } from '@angular/core';
import * as countries from '../data/countries.json'
import mapboxgl, { LngLatLike } from 'mapbox-gl'
import { environment } from 'src/environments/environment';

export enum Colors {
  red = '#e91e63',
  green = '#4caf50',
  yellow = '#ffc107',
  gray = '#ababab',
}


@Injectable({
  providedIn: 'root'
})
export class MapService {

  map: mapboxgl.Map
  // style = 'mapbox://styles/mapbox/streets-v11'
  style = 'mapbox://styles/mapbox/light-v9'
  // style = 'mapbox://styles/dalenguyen/ckkg85yqv04h917sc6tfli16n'
  // style = 'mapbox://styles/dalenguyen/ckkh262co0n8c17p0zxoawiae' // New Course
  lat = 37.75
  lng = -122.41

  imageJson = {
    'type': 'FeatureCollection',
    'features': [
      {
        'type': 'Feature',
        'properties': {
          'message': 'Foo',
          'iconSize': [60, 60]
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [-66.324462890625, -16.024695711685304]
        }
      },
      {
        'type': 'Feature',
        'properties': {
          'message': 'Bar',
          'iconSize': [50, 50]
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [-61.2158203125, -15.97189158092897]
        }
      },
      {
        'type': 'Feature',
        'properties': {
          'message': 'Baz',
          'iconSize': [40, 40]
        },
        'geometry': {
          'type': 'Point',
          'coordinates': [-63.29223632812499, -18.28151823530889]
        }
      }
    ]
  };

  constructor() { }

  initializeMap() {
    this.map = new mapboxgl.Map({
      accessToken: environment.mapbox.accessToken,
      container: 'map',
      style: this.style,
      zoom: 2,
      touchZoomRotate: true,
      dragRotate: true,
      // minZoom: 2,
      // maxZoom: 6,
      center: [this.lng, this.lat],

    })
    // Add map controls
    this.map.addControl(new mapboxgl.NavigationControl())

    this.map.on('load', () => {
      this.addMarker()

      // Countries
      this._addCountriesSource()

      const layerData = {
        id: 'countries',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': {
            type: 'categorical',
            property: 'ISO_A3',
            // TODO: Loop through countries and create an array of color
            stops: [['CAN', 'red'], ['USA', 'blue']],
          },
          'fill-outline-color': '#52489C',
          'fill-opacity': 0.6,
        },
        filter: ['==', '$type', 'Polygon'],
      }

      this.addLayer(layerData, 'countries')
    })
  }

  _addCountriesSource() {
    if (this.map.getSource('countries') == null) {
      this.map.addSource('countries', {
        type: 'geojson',
        data: countries['default'],
      })
    }
  }

  addLayer(data, layerSource: string) {
    if (this.map) {
      if (this.map.getLayer(layerSource)) {
        this.map.removeLayer(layerSource)
      }
      this.map.addLayer(data)
    }
  }

  addMarker() {
    // add markers to map
    this.imageJson.features.forEach((marker) => {
      // create a DOM element for the marker
      var el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage =
        'url(https://placekitten.com/g/' +
        marker.properties['iconSize'].join('/') +
        '/)';
      el.style.width = marker.properties.iconSize[0] + 'px';
      el.style.height = marker.properties.iconSize[1] + 'px';

      el.addEventListener('click', () => {
        window.alert(marker.properties.message);
      });

      // add marker to map
      new mapboxgl.Marker(el)
        .setLngLat(marker.geometry.coordinates as LngLatLike)
        .addTo(this.map);
    });
  }
}
