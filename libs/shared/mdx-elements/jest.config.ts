export default {
  displayName: 'shared-mdx-elements',

  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../coverage/libs/shared/mdx-elements',
  preset: '../../../jest.preset.js',
}
