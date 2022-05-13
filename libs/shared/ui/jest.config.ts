export default {
  displayName: 'shared-ui',

  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/ui',
  preset: '../../../jest.preset.js',
}
