import { http } from '@google-cloud/functions-framework'
import 'tslib' // needed until importHelpers is set to false

http('helloGET', (req, res) => {
  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`)
})
