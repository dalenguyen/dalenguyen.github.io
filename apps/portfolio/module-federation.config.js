module.exports = {
  name: 'portfolio',
  remotes: ['resume-remote'],
  shared: (name, config) => {
    if (name === 'smoothscroll-polyfill') {
      return { ...config, eager: true }
    }
    return config
  },
}
