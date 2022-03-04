const { createGlobPatternsForDependencies } = require('@nrwl/next/tailwind')
const { join } = require('path')

module.exports = {
  mode: 'jit',
  presets: [require('../../tailwind-workspace-preset.js')],
  purge: [join(__dirname, 'pages/**/*.{js,ts,jsx,tsx}'), ...createGlobPatternsForDependencies(__dirname)],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
