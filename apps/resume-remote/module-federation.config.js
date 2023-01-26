module.exports = {
  name: 'resume-remote',
  exposes: {
    './Routes': 'apps/resume-remote/src/app/remote-entry/entry.routes.ts',
  },
  // shared: (name, config) => {
  //   if (['@angular/core', '@angular/router'].includes(name)) {
  //     console.log(name, config)
  //     return config
  //   }
  //   return false
  // },
}
