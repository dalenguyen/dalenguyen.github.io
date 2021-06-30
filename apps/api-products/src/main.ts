/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express'
import {OpenAI} from '@dalenguyen/openai'
import { environment } from './environments/environment';

const app = express()

app.get('/api', async (req, res) => {
  try {
    console.log(`Get API`);

    const openAI = new OpenAI(environment.openAIKey)
    const list = await openAI.engines()
    console.log(list);

    res.send(list)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

const port = process.env.port || 8080

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`)
})
server.on('error', console.error)
