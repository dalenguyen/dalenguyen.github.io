import { versions } from './versions'
import * as pkg from '../../package.json'

export const environment = {
  production: true,
  version: pkg.version,
  gitHash: versions.revision,
  butterCMS: '10de8a1782f01676902398495c4062893956ac9c'
}
