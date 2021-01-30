import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import mapboxgl, { LngLatLike } from 'mapbox-gl'
import { environment } from 'src/environments/environment';
import * as countries from './countries.json'

// https://docs.mapbox.com/mapbox-gl-js/api/
// https://dev.to/wuz/building-a-country-highlighting-tool-with-mapbox-2kbh
// https://codepen.io/wuz/pen/ayOwjY?editors=0010
@Component({
  selector: 'app-mapbox',
  templateUrl: './mapbox.component.html',
  styleUrls: ['./mapbox.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapboxComponent implements OnInit {

  geoJson = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -124.76074218749999,
                43.100982876188546
              ],
              [
                -124.71679687499999,
                40.245991504199026
              ],
              [
                -121.81640624999999,
                39.470125122358176
              ],
              [
                -116.103515625,
                41.57436130598913
              ],
              [
                -116.103515625,
                44.276671273775186
              ],
              [
                -117.24609374999999,
                46.01222384063236
              ],
              [
                -120.89355468749999,
                47.60616304386874
              ],
              [
                -123.8818359375,
                46.619261036171515
              ],
              [
                -124.76074218749999,
                43.100982876188546
              ]
            ]
          ]
        }
      }
    ]
  }

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

  map: mapboxgl.Map
  // style = 'mapbox://styles/mapbox/streets-v11'
  style = 'mapbox://styles/mapbox/light-v9'
  // style = 'mapbox://styles/dalenguyen/ckkg85yqv04h917sc6tfli16n'
  // style = 'mapbox://styles/dalenguyen/ckkh262co0n8c17p0zxoawiae' // New Course
  lat = 37.75
  lng = -122.41

  constructor() { }

  ngOnInit(): void {
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
    // this.map.setZoom(4)

    // console.log(countries['default'])

    // setTimeout(() => {
    //   this.map.flyTo({
    //     zoom: 4,
    //     center: [-122.00, 37.70],
    //   })
    // }, 2000);

    let count = 0
    // setInterval(() => {
    //   count += 0.01;
    //     (<any>this.map.getSource('national-park'))?.setData({
    //       "type": "FeatureCollection",
    //       "features": [
    //         {
    //           "type": "Feature",
    //           "properties": {},
    //           "geometry": {
    //             "type": "Polygon",
    //             "coordinates": [
    //               [
    //                 [
    //                   -124.76074218749999 + count,
    //                   43.100982876188546 + count
    //                 ],
    //                 [
    //                   -124.71679687499999 + count,
    //                   40.245991504199026 + count
    //                 ],
    //                 [
    //                   -121.81640624999999 + count,
    //                   39.470125122358176 + count
    //                 ],
    //                 [
    //                   -116.103515625 + count,
    //                   41.57436130598913 + count
    //                 ],
    //                 [
    //                   -116.103515625 + count,
    //                   44.276671273775186 + count
    //                 ],
    //                 [
    //                   -117.24609374999999 + count,
    //                   46.01222384063236 + count
    //                 ],
    //                 [
    //                   -120.89355468749999 + count,
    //                   47.60616304386874 + count
    //                 ],
    //                 [
    //                   -123.8818359375 + count,
    //                   46.619261036171515 + count
    //                 ],
    //                 [
    //                   -124.76074218749999 + count,
    //                   43.100982876188546 + count
    //                 ]
    //               ]
    //             ]
    //           }
    //         }
    //       ]
    //     })
    // }, 0.01)

    this.map.on('mousedown', 'state-label-lg', e => {
      console.log(e)
      // Show features / label
      const features = this.map.queryRenderedFeatures(e.point)
      console.log(features);
      this.map.setLayoutProperty('state-label-lg', 'icon-image', 'art-gallery-11')
      // this.map.setPaintProperty('landcover_crop', 'fill-color', '#000000')


      const mapboxSource = this.map.querySourceFeatures('composite', {
        sourceLayer: 'landuse',
        filter: ["==", 'class', 'wood']
      })
      console.log(mapboxSource);
    })
    // https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/
    this.map.on('load', () => {

      // this.map.dragRotate.enable()
      // this.map.touchZoomRotate.enableRotation()
      // this.map.touchZoomRotate.enable()

      // this.map.setPaintProperty('settlement-minor-label', 'text-opacity', 0)
      // this.map.setLayoutProperty('state-label', 'icon-image', 'art-gallery-11')
      // Hide label
      // this.map.setPaintProperty('state-label', 'text-opacity', 0)


      // vector
      // this.map.addSource('mapbox-streets', {
      //   type: 'vector',
      //   url: 'mapbox://mapbox.mapbox-streets-v7'
      // })

      // this.map.addLayer({
      //   'id': 'mapbox-streets',
      //   'type': 'line',
      //   "source-layer": "road",
      //   'source': 'mapbox-streets',
      //   'paint': {
      //     'line-color': '#ff69b4',
      //     'line-opacity': 1
      //   },
      // });


      // geojson
      this.map.addSource('national-park', {
        'type': 'geojson',
        data: this.geoJson as any
      });

      // https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/
      // File
      this.map.addLayer({
        'id': 'park-boundary',
        'type': 'fill',
        'source': 'national-park',
        'paint': {
          'fill-color': '#666666',
          'fill-outline-color': '#ffffff',
          'fill-opacity': 0.4
        },
        'filter': ['==', '$type', 'Polygon']
      });

      // Line
      // this.map.addLayer({
      //   'id': 'park-boundary',
      //   'type': 'line',
      //   'source': 'national-park',
      //   'paint': {
      //     'line-color': '#000000',
      //     'line-width': 10
      //   },
      // });

      // Fill Extrusion
      // this.map.addLayer({
      //   'id': 'park-boundary',
      //   'type': 'fill-extrusion',
      //   'source': 'national-park',
      //   'paint': {
      //     'fill-extrusion-color': '#000000',
      //     'fill-extrusion-height': 10,
      //     'fill-extrusion-opacity': 0.6
      //   },
      // });

      // Circle
      // this.map.addLayer({
      //   'id': 'park-volcanoes',
      //   'type': 'circle',
      //   'source': 'national-park',
      //   'paint': {
      //     'circle-radius': 6,
      //     'circle-color': '#B42222'
      //   },
      //   'filter': ['==', '$type', 'Point']
      // });

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

      // Countries
      this.map.addSource('countries', {
        'type': 'geojson',
        data: countries['default']
      });

      this.map.addLayer({
        'id': 'countries',
        'type': 'fill',
        'source': 'countries',
        'paint': {
          'fill-color': {
            type: 'categorical',
            property: 'ISO_A3',
            stops: [['CAN', 'red'], ['USA', 'blue']]
          },
          'fill-outline-color': '#52489C',
          'fill-opacity': 0.6
        },
        'filter': ['==', '$type', 'Polygon']
      });

      // this.map.addLayer({
      //   //here we are adding a layer containing the tileset we just uploaded
      //   id: 'countries', //this is the name of our layer, which we will need later
      //   source: {
      //     type: 'vector',
      //     url: 'mapbox://dalenguyen.1msxx4kw', // <--- Add the Map ID you copied here
      //   },
      //   'source-layer': 'ne_10m_admin_0_countries_lake-2t7lm9', // <--- Add the source layer name you copied here
      //   type: 'fill',
      //   paint: {
      //     'fill-color': '#52489C',
      //     'fill-outline-color': '#F2F2F2',
      //     'fill-opacity': 0.6
      //   },
      // });

      // this.map.setFilter('countries', ['in', 'ADM0_A3_IS'].concat(['USA', 'AUS', 'NGA']));

      // this.map.on('click', 'countries', (mapElement) => {
      //   const countryCode = mapElement.features[0].properties.ADM0_A3_IS; // Grab the country code from the map properties.

      //   fetch(`https://restcountries.eu/rest/v2/alpha/${countryCode}`) // Using tempalate tags to create the API request
      //     .then((data) => data.json()) //fetch returns an object with a .json() method, which returns a promise
      //     .then((country) => { //country contains the data from the API request
      //       // Let's build our HTML in a template tag
      //       const html = `
      //       <ul>
      //           <img src='${country.flag}' />
      //           <li><h3>${country.name}</h3></li>
      //           <li><strong>Currencies:</strong> ${country.currencies.map((c) => c.code).join(', ')}</li>
      //           <li><strong>Capital:</strong> ${country.capital}</li>
      //           <li><strong>Population:</strong> ${country.population}</li>
      //           <li><strong>Demonym:</strong> ${country.demonym}</li>
      //         </ul>
      //       `; // Now we have a good looking popup HTML segment.
      //       new mapboxgl.Popup() //Create a new popup
      //         .setLngLat(mapElement.lngLat) // Set where we want it to appear (where we clicked)
      //         .setHTML(html) // Add the HTML we just made to the popup
      //         .addTo(this.map); // Add the popup to the map
      //     });
      // });

      // color
      // Color only few countries
      //   this.map.addLayer({
      //     'id': 'maine',
      //     'type': 'fill',
      //     'layout': {},
      //     'paint': {
      //       'fill-color': {
      //         property: 'name',
      //         type: 'categorical',
      //         stops: [
      //           ['Albania', '#F2F12D'],
      //           ['Algeria', '#7A4900'],
      //           ['Australia', '#63FFAC'],
      //           ["South Africa", "#4FC601"],
      //           ["South Korea", "#3B5DFF"],
      //         ]
      //       },
      //       'fill-opacity': 0.8
      //     },
      //     'source': {
      //       'type': 'vector',
      //       'url': 'mapbox://saurabhp.countries_tileset'
      //     },
      //     "source-layer": "countries",
      //   });
    })
  }

}
