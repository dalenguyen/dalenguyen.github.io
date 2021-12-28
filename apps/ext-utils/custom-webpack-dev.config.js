const config = require('./custom-webpack.config.js')
const ExtensionReloader = require('webpack-extension-reloader')

module.exports = {
  ...config,
  mode: 'development',
  plugins: [
    new ExtensionReloader({
      reloadPage: true,
      entries: {
        background: 'apps/ext-utils/src/background.ts',
        'content-script': 'apps/ext-utils/src/content-script.ts',
      },
    }),
  ],
}
