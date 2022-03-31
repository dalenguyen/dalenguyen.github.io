const fs = require('fs-extra')

;(async () => {
  const src = '../..dist/apps/portfolio/browser'
  const copy = './dist'

  await fs.remove(copy)
  await fs.copy(src, copy)
})()
