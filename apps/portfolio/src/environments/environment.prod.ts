import { versions } from './versions'
import packageInfo from '../../../../package.json'

export const environment = {
  production: true,
  version: packageInfo.version,
  gitHash: versions.revision,
  butterCMSToken: '10de8a1782f01676902398495c4062893956ac9c',
  mapbox: {
    accessToken: 'pk.eyJ1IjoiZGFsZW5ndXllbiIsImEiOiJja2tlamhhNjcwMHVyMnFvNHJtNHhjZ2RyIn0.Lm3dJG12k3-LmOu_G5y-qA',
  },
}
