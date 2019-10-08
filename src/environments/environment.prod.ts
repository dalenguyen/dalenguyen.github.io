import { versions } from './versions'
import * as pkg from '../../package.json';

export const environment = {
  production: true,
  version: pkg.version,
  gitHash: versions.revision
};
