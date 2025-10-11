const { withModuleFederation } = require('@nx/module-federation/angular')
const config = require('./module-federation.config')
module.exports = withModuleFederation(config, { dts: false })
