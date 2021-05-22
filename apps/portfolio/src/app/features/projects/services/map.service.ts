import { Injectable } from '@angular/core';
import * as countries from '../data/countries.json';
import mapboxgl, { LngLatLike } from 'mapbox-gl';
import { Subject } from 'rxjs';
import { environment } from 'apps/portfolio/src/environments/environment';

export enum Colors {
  red = '#e91e63',
  green = '#4caf50',
  yellow = '#ffc107',
  gray = '#ababab',
}
@Injectable({
  providedIn: 'root',
})
export class MapService {
  map: mapboxgl.Map;
  // style = 'mapbox://styles/mapbox/streets-v11'
  style = 'mapbox://styles/mapbox/light-v10';
  // style = 'mapbox://styles/dalenguyen/ckkg85yqv04h917sc6tfli16n'
  // style = 'mapbox://styles/dalenguyen/ckkh262co0n8c17p0zxoawiae' // New Course
  lat = 37.75;
  lng = -122.41;

  imageJson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          message: 'Foo',
          iconSize: [60, 60],
        },
        geometry: {
          type: 'Point',
          coordinates: [-66.324462890625, -16.024695711685304],
        },
      },
      {
        type: 'Feature',
        properties: {
          message: 'Bar',
          iconSize: [50, 50],
        },
        geometry: {
          type: 'Point',
          coordinates: [-61.2158203125, -15.97189158092897],
        },
      },
      {
        type: 'Feature',
        properties: {
          message: 'Baz',
          iconSize: [40, 40],
        },
        geometry: {
          type: 'Point',
          coordinates: [-63.29223632812499, -18.28151823530889],
        },
      },
    ],
  };

  countryDetail$ = new Subject<string>();

  constructor() {}

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
    });
    // Add map controls
    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.on('load', () => {
      // this.addMarker()

      this._addCountryBoundaries();
      // this._addCountryBoudariesFromFile()

      // // Add map event
      // // this._addClickEvents()
      this._addHoverEvents();

      // // initialize first country data
      this._getCountryInfo('CAN');
    });
  }

  _addCountriesSource() {
    if (this.map.getSource('countries') == null) {
      this.map.addSource('countries', {
        type: 'geojson',
        data: countries['default'],
      });
    }
  }

  addLayer(data, layerSource: string) {
    if (this.map) {
      if (this.map.getLayer(layerSource)) {
        this.map.removeLayer(layerSource);
      }
      this.map.addLayer(data);
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

  setFilter(layerId: string, filter: any[]) {
    this.map?.setFilter(layerId, filter);
  }

  private _addClickEvents() {
    this.map.on('click', 'countries', (mapElement) => {
      console.log(mapElement.features[0].properties.ISO_A3);
    });
  }

  private _addHoverEvents() {
    this.map.on('mouseover', 'countries', (mapElement) => {
      // const countryCode = mapElement.features[0].properties.ISO_A3
      const countryCode = mapElement.features[0].properties.iso_3166_1_alpha_3;
      this._getCountryInfo(countryCode);

      // Add higlight to country when hovering
      let highlightLayerName = 'countries-highlighted';
      let filterProperty = 'iso_3166_1_alpha_3';
      let filters = ['all', ['==', filterProperty, countryCode]];

      this.setFilter(highlightLayerName, filters);
    });
  }

  private _getCountryInfo(countryCode: string) {
    fetch(`https://restcountries.eu/rest/v2/alpha/${countryCode}`)
      .then((data) => data.json())
      .then((country) => {
        const html = `
            <img src='${country.flag}' />
            <ul>
              <li><h3>${country.name}</h3></li>
              <li><strong>Currencies:</strong> ${country.currencies
                .map((c: { code: unknown }) => c.code)
                .join(', ')}</li>
              <li><strong>Capital:</strong> ${country.capital}</li>
              <li><strong>Population:</strong> ${country.population}</li>
              <li><strong>Demonym:</strong> ${country.demonym}</li>
            </ul>
          `;
        this.countryDetail$.next(html);
      });
  }

  private _addCountryBoundaries() {
    // https://docs.mapbox.com/mapbox-gl-js/example/data-join/ color codes

    this.map.addSource('countries', {
      type: 'vector',
      url: 'mapbox://mapbox.country-boundaries-v1',
    });

    // Build a GL match expression that defines the color for every vector tile feature
    // Use the ISO 3166-1 alpha 3 code as the lookup key for the country shape
    const matchExpression = [
      'match',
      ['get', 'iso_3166_1_alpha_3'],
    ] as mapboxgl.Expression;

    // Calculate color values for each country based on 'hdi' value
    countries['default'].features.forEach((country) => {
      // Convert the range of data values to a suitable color
      const countryCode = country.properties.ISO_A3;
      if (countryCode != -99) {
        const randomIndex = Math.floor(
          Math.random() * Object.keys(Colors).length
        );
        matchExpression.push(countryCode, Object.keys(Colors)[randomIndex]);
      }
    });

    // Last value is the default, used where there is no data
    matchExpression.push('rgba(0, 0, 0, 0)');

    // Add layer from the vector tile source to create the choropleth
    // Insert it below the 'admin-1-boundary-bg' layer in the style
    this.map.addLayer(
      {
        id: 'countries',
        type: 'fill',
        source: 'countries',
        'source-layer': 'country_boundaries',
        paint: {
          'fill-color': matchExpression,
          'fill-opacity': 0.6,
        },
      },
      'admin-1-boundary-bg'
    );

    this.map.addLayer(
      {
        id: 'countries-highlighted',
        type: 'line',
        source: 'countries',
        'source-layer': 'country_boundaries',
        paint: {
          'line-color': '#262626',
          'line-width': 2,
        },
        // Display none by adding a
        // filter with an empty string.
        filter: ['in', 'iso_3166_1_alpha_3', ''],
      },
      'settlement-label'
    ); // Place polygons under labels.

    // Set water color
    this.map.setPaintProperty('water', 'fill-color', '#e4eefc');
  }

  private _addCountryBoudariesFromFile() {
    // Countries
    this._addCountriesSource();

    const layerData: mapboxgl.AnyLayer = {
      id: 'countries',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': {
          default: 'transparent',
          type: 'categorical',
          property: 'ISO_A3',
          // TODO: Loop through countries and create an array of color
          stops: [
            ['CAN', 'red'],
            ['USA', 'blue'],
            ['XXX', 'white'],
          ],
        },
        // 'fill-outline-color': '#52489C',
        'fill-opacity': 0.6,
      },
      filter: ['==', '$type', 'Polygon'],
    };

    this.addLayer(layerData, 'countries');
  }
}
