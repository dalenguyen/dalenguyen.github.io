const { withModuleFederation } = require('@nrwl/angular/module-federation')
const config = require('./module-federation.config')
module.exports = withModuleFederation({
  ...config,
  remotes: [['resume-remote', 'https://dalenguyen.github.io/resume-remote']],
  shared: {
    '@angular/core': { singleton: true, strictVersion: true, eager: true },
    '@angular/material/icon': { singleton: true, strictVersion: true, eager: true },
    '@angular/router/': { singleton: true, strictVersion: true, eager: true },
  },
  /*
   * Remote overrides for production.
   * Each entry is a pair of an unique name and the URL where it is deployed.
   *
   * e.g.
   * remotes: [
   *   ['app1', 'https://app1.example.com'],
   *   ['app2', 'https://app2.example.com'],
   * ]
   */
})
