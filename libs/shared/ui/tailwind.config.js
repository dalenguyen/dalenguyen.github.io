const { createGlobPatternsForDependencies } = require('@nx/next/tailwind')
const { join } = require('path')

module.exports = {
  presets: [require('../../../tailwind-workspace-preset.js')],
  purge: [join(__dirname, '../src/**/*.{js,ts,jsx,tsx}'), ...createGlobPatternsForDependencies(__dirname)],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
