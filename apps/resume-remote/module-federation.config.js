module.exports = {
  name: 'resume-remote',
  exposes: {
    './Routes': 'apps/resume-remote/src/app/remote-entry/entry.routes.ts',
  },
}
