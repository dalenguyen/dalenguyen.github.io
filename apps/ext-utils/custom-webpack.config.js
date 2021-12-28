module.exports = {
  entry: {
    background: 'apps/ext-utils/src/background.ts',
    'content-script': 'apps/ext-utils/src/content-script.ts',
  },
  optimization: {
    runtimeChunk: false,
  },
}
