// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.
import packageInfo from '../../../../package.json'
import { versions } from './versions'

export const environment = {
  production: false,
  version: packageInfo?.version,
  gitHash: versions.revision,
  butterCMSToken: '10de8a1782f01676902398495c4062893956ac9c',
  mapbox: {
    accessToken: 'pk.eyJ1IjoiZGFsZW5ndXllbiIsImEiOiJja2tlamhhNjcwMHVyMnFvNHJtNHhjZ2RyIn0.Lm3dJG12k3-LmOu_G5y-qA',
  },
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
